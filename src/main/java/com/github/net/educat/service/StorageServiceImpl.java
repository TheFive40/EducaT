package com.github.net.educat.service;

import com.github.net.educat.application.StorageQuotaService;
import com.github.net.educat.application.StorageService;
import com.github.net.educat.domain.FileReference;
import com.github.net.educat.domain.StoredFile;
import com.github.net.educat.repository.FileReferenceRepository;
import com.github.net.educat.repository.InstitutionSettingsRepository;
import com.github.net.educat.repository.StoredFileRepository;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.annotation.PostConstruct;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.ByteArrayResource;
import org.springframework.core.io.Resource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.io.ByteArrayOutputStream;
import java.io.IOException;
import java.nio.file.*;
import java.security.MessageDigest;
import java.security.NoSuchAlgorithmException;
import java.time.LocalDateTime;
import java.util.HexFormat;
import java.util.Iterator;
import java.util.List;
import java.util.Map;
import java.util.zip.GZIPInputStream;
import java.util.zip.GZIPOutputStream;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StorageServiceImpl implements StorageService {

    private final StoredFileRepository storedFileRepository;
    private final FileReferenceRepository fileReferenceRepository;
    private final StorageQuotaService quotaService;
    private final InstitutionSettingsRepository institutionSettingsRepository;

    @Value("${educat.storage.base-path:./educat-uploads}")
    private String basePath;

    @Value("${educat.storage.max-file-size:10485760}")
    private long maxFileSize;

    @Value("${educat.storage.compression-enabled:true}")
    private boolean compressionEnabled;

    private Path storageDir;
    private boolean ecoModeEnabled = false;

    private void refreshSettings() {
        try {
            institutionSettingsRepository.findAll().stream().findFirst().ifPresent(s -> {
                String json = s.getStorageSettingsJson();
                if (json != null && !json.isBlank()) {
                    try {
                        Map<String, Object> map = new ObjectMapper().readValue(json, new TypeReference<>() {});
                        ecoModeEnabled = Boolean.TRUE.equals(map.get("ecoModeEnabled"));
                    } catch (Exception e) {
                        ecoModeEnabled = false;
                    }
                }
            });
        } catch (Exception e) {
            ecoModeEnabled = false;
        }
    }

    @PostConstruct
    public void init() {
        try {
            storageDir = Paths.get(basePath).toAbsolutePath().normalize();
            Files.createDirectories(storageDir);
            log.info("Storage directory initialized: {}", storageDir);
        } catch (IOException e) {
            throw new RuntimeException("Could not create storage directory: " + basePath, e);
        }
    }

    @Override
    public StoredFile storeFile(MultipartFile file, String entityType, String entityId, String fieldName) throws IOException {
        if (file.getSize() > maxFileSize) {
            throw new IllegalArgumentException("File exceeds maximum size of " + (maxFileSize / 1024 / 1024) + " MB");
        }
        byte[] data = file.getBytes();
        return storeBytes(data, file.getOriginalFilename(), file.getContentType(), entityType, entityId, fieldName);
    }

    @Override
    public StoredFile storeBytes(byte[] data, String fileName, String contentType,
                                  String entityType, String entityId, String fieldName) throws IOException {
        if (data == null || data.length == 0) {
            throw new IllegalArgumentException("File data cannot be empty");
        }

        refreshSettings();
        long originalSize = data.length;
        String hash = computeSha256(data);

        // Deduplication: check if file already exists
        var existing = storedFileRepository.findByFileHash(hash);
        if (existing.isPresent()) {
            StoredFile sf = existing.get();
            sf.setReferenceCount(sf.getReferenceCount() + 1);
            sf.setLastAccessedAt(LocalDateTime.now());
            storedFileRepository.save(sf);
            createReference(sf, entityType, entityId, fieldName);
            quotaService.addUsage("GLOBAL", "INSTITUTION", sf.getFileSize());
            log.info("Deduplicated file: {} (hash: {}), ref count: {}", fileName, hash, sf.getReferenceCount());
            return sf;
        }

        // Check global quota only (no per-user limits)
        if (!quotaService.hasQuotaAvailable("GLOBAL", "INSTITUTION", data.length)) {
            throw new IllegalStateException("Storage quota exceeded. Contact administrator.");
        }

        // Compression
        boolean isCompressed = false;
        byte[] storedData = data;
        long storedSize = originalSize;

        // Eco mode: recompress images with lower quality
        if (ecoModeEnabled && isImage(fileName, contentType)) {
            byte[] recompressed = recompressImage(data, fileName, contentType);
            if (recompressed != null && recompressed.length < storedSize) {
                storedData = recompressed;
                storedSize = recompressed.length;
                isCompressed = true;
                log.debug("Eco-mode recompressed image {}: {} -> {} bytes ({}% reduction)",
                        fileName, originalSize, storedSize,
                        Math.round((1 - (double) storedSize / originalSize) * 100));
            }
        }

        // Compress PDF internals (scanned documents) before GZIP.
        // PDFBox compression produces a valid PDF; it does NOT require gzipDecompress on download.
        if (isPdf(fileName, contentType) && storedData.length > 256 * 1024) { // Only for PDFs > 256 KB
            byte[] pdfCompressed = compressPdf(storedData);
            if (pdfCompressed.length < storedSize) {
                storedData = pdfCompressed;
                storedSize = pdfCompressed.length;
                // isCompressed stays false because the result is a normal PDF, not GZIP.
            }
        }

        if (compressionEnabled && shouldCompress(fileName, contentType)) {
            byte[] compressed = gzipCompress(storedData);
            double threshold = ecoModeEnabled ? 1.0 : 0.95; // Eco mode always compresses if equal or smaller
            if (compressed.length < storedData.length * threshold) {
                storedData = compressed;
                storedSize = compressed.length;
                isCompressed = true;
                log.debug("Compressed {}: {} -> {} bytes ({}% reduction)",
                        fileName, originalSize, storedSize,
                        Math.round((1 - (double) storedSize / originalSize) * 100));
            }
        }

        // Store file
        String ext = getExtension(fileName);
        String storageName = hash + (isCompressed ? ".gz" : (ext.isEmpty() ? "" : "." + ext));
        Path targetPath = storageDir.resolve(storageName);

        Files.write(targetPath, storedData, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);

        StoredFile sf = StoredFile.builder()
                .fileHash(hash)
                .fileName(fileName != null ? fileName : storageName)
                .contentType(contentType != null ? contentType : "application/octet-stream")
                .fileSize(storedSize)
                .storagePath(targetPath.toString())
                .referenceCount(1)
                .createdAt(LocalDateTime.now())
                .lastAccessedAt(LocalDateTime.now())
                .compressionEnabled(isCompressed)
                .build();

        sf = storedFileRepository.save(sf);
        createReference(sf, entityType, entityId, fieldName);
        quotaService.addUsage("GLOBAL", "INSTITUTION", storedSize);

        log.info("Stored file: {} (hash: {}, original: {} bytes, stored: {} bytes, compressed: {})",
                fileName, hash, originalSize, storedSize, isCompressed);
        return sf;
    }

    @Override
    @Transactional(readOnly = true)
    public Resource downloadFile(Integer storedFileId) {
        StoredFile sf = storedFileRepository.findById(storedFileId)
                .orElseThrow(() -> new RuntimeException("File not found: " + storedFileId));
        try {
            byte[] data = Files.readAllBytes(Paths.get(sf.getStoragePath()));

            // Decompress if needed
            if (Boolean.TRUE.equals(sf.getCompressionEnabled())) {
                data = gzipDecompress(data);
            }

            sf.setLastAccessedAt(LocalDateTime.now());
            storedFileRepository.save(sf);

            final byte[] finalData = data;
            return new ByteArrayResource(finalData) {
                @Override
                public String getFilename() {
                    return sf.getFileName();
                }
            };
        } catch (IOException e) {
            throw new RuntimeException("Could not read file: " + sf.getStoragePath(), e);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public StoredFile getStoredFile(Integer id) {
        return storedFileRepository.findById(id)
                .orElseThrow(() -> new RuntimeException("File not found: " + id));
    }

    @Override
    public void deleteFileReference(Integer storedFileId, String entityType, String entityId) {
        var refOpt = fileReferenceRepository.findByStoredFileIdAndEntityTypeAndEntityId(storedFileId, entityType, entityId);
        if (refOpt.isEmpty()) return;

        FileReference ref = refOpt.get();
        fileReferenceRepository.delete(ref);

        StoredFile sf = ref.getStoredFile();
        int newCount = sf.getReferenceCount() - 1;
        sf.setReferenceCount(Math.max(0, newCount));
        storedFileRepository.save(sf);

        quotaService.subtractUsage("GLOBAL", "INSTITUTION", sf.getFileSize());

        if (newCount <= 0) {
            deletePhysicalFile(sf);
        }
    }

    @Override
    public void deleteEntityReferences(String entityType, String entityId) {
        var refs = fileReferenceRepository.findByEntityTypeAndEntityId(entityType, entityId);
        for (FileReference ref : refs) {
            deleteFileReference(ref.getStoredFile().getId(), entityType, entityId);
        }
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalStorageUsed() {
        return storedFileRepository.findAll().stream()
                .mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L)
                .sum();
    }

    @Override
    @Transactional(readOnly = true)
    public long getTotalFilesCount() {
        return storedFileRepository.count();
    }

    @Override
    @Transactional(readOnly = true)
    public List<StoredFile> findOrphanedFiles() {
        return storedFileRepository.findAll().stream()
                .filter(f -> f.getReferenceCount() == null || f.getReferenceCount() <= 0)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public double getCompressionRatio() {
        List<StoredFile> files = storedFileRepository.findAll();
        long compressed = files.stream()
                .filter(f -> Boolean.TRUE.equals(f.getCompressionEnabled()))
                .mapToLong(StoredFile::getFileSize)
                .sum();
        long total = files.stream()
                .mapToLong(StoredFile::getFileSize)
                .sum();
        return total > 0 ? (double) compressed / total : 0.0;
    }

    private void createReference(StoredFile sf, String entityType, String entityId, String fieldName) {
        FileReference ref = FileReference.builder()
                .storedFile(sf)
                .entityType(entityType)
                .entityId(entityId)
                .fieldName(fieldName)
                .build();
        fileReferenceRepository.save(ref);
    }

    private void deletePhysicalFile(StoredFile sf) {
        try {
            Path path = Paths.get(sf.getStoragePath());
            Files.deleteIfExists(path);
            storedFileRepository.delete(sf);
            log.info("Deleted orphaned file: {} (hash: {})", sf.getFileName(), sf.getFileHash());
        } catch (IOException e) {
            log.error("Could not delete physical file: {}", sf.getStoragePath(), e);
        }
    }

    private boolean shouldCompress(String fileName, String contentType) {
        if (fileName == null && contentType == null) return false;
        String fn = (fileName != null ? fileName : "").toLowerCase();
        String ct = (contentType != null ? contentType : "").toLowerCase();
        return ct.contains("text") || ct.contains("json") || ct.contains("xml") || ct.contains("pdf")
                || fn.endsWith(".txt") || fn.endsWith(".json") || fn.endsWith(".xml")
                || fn.endsWith(".csv") || fn.endsWith(".pdf") || fn.endsWith(".doc")
                || fn.endsWith(".docx");
    }

    private byte[] gzipCompress(byte[] data) throws IOException {
        ByteArrayOutputStream bos = new ByteArrayOutputStream(data.length);
        try (GZIPOutputStream gzip = new GZIPOutputStream(bos)) {
            gzip.write(data);
        }
        return bos.toByteArray();
    }

    private byte[] gzipDecompress(byte[] data) throws IOException {
        java.io.ByteArrayInputStream bis = new java.io.ByteArrayInputStream(data);
        try (GZIPInputStream gzip = new GZIPInputStream(bis);
             java.io.ByteArrayOutputStream out = new java.io.ByteArrayOutputStream()) {
            byte[] buffer = new byte[8192];
            int len;
            while ((len = gzip.read(buffer)) != -1) {
                out.write(buffer, 0, len);
            }
            return out.toByteArray();
        }
    }

    private String computeSha256(byte[] data) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(data);
            return HexFormat.of().formatHex(hash);
        } catch (NoSuchAlgorithmException e) {
            throw new RuntimeException("SHA-256 not available", e);
        }
    }

    private String getExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) return "";
        int lastDot = fileName.lastIndexOf('.');
        return lastDot < fileName.length() - 1 ? fileName.substring(lastDot + 1).toLowerCase() : "";
    }

    private boolean isImage(String fileName, String contentType) {
        if (fileName == null && contentType == null) return false;
        String fn = (fileName != null ? fileName : "").toLowerCase();
        String ct = (contentType != null ? contentType : "").toLowerCase();
        return ct.contains("image") || fn.endsWith(".jpg") || fn.endsWith(".jpeg")
                || fn.endsWith(".png") || fn.endsWith(".gif") || fn.endsWith(".webp");
    }

    private boolean isPdf(String fileName, String contentType) {
        if (fileName == null && contentType == null) return false;
        String fn = (fileName != null ? fileName : "").toLowerCase();
        String ct = (contentType != null ? contentType : "").toLowerCase();
        return ct.contains("pdf") || fn.endsWith(".pdf");
    }

    private byte[] recompressImage(byte[] data, String fileName, String contentType) {
        try {
            java.io.ByteArrayInputStream bais = new java.io.ByteArrayInputStream(data);
            java.awt.image.BufferedImage image = javax.imageio.ImageIO.read(bais);
            if (image == null) return null;

            String format = "jpg";
            if (fileName != null && fileName.toLowerCase().endsWith(".png")) format = "png";

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            if ("jpg".equals(format) || "jpeg".equals(format)) {
                javax.imageio.ImageWriter writer = javax.imageio.ImageIO.getImageWritersByFormatName("jpg").next();
                javax.imageio.stream.ImageOutputStream ios = javax.imageio.ImageIO.createImageOutputStream(baos);
                writer.setOutput(ios);
                javax.imageio.ImageWriteParam param = writer.getDefaultWriteParam();
                if (param.canWriteCompressed()) {
                    param.setCompressionMode(javax.imageio.ImageWriteParam.MODE_EXPLICIT);
                    param.setCompressionQuality(0.65f); // Eco mode: 65% quality
                }
                writer.write(null, new javax.imageio.IIOImage(image, null, null), param);
                writer.dispose();
                ios.close();
            } else {
                javax.imageio.ImageIO.write(image, format, baos);
            }
            return baos.toByteArray();
        } catch (Exception e) {
            log.warn("Failed to recompress image: {}", fileName, e);
            return null;
        }
    }

    /**
     * Compress scanned PDFs by re-encoding internal images with lower JPEG quality.
     * Returns original data if PDFBox fails or if the result is larger.
     */
    public byte[] compressPdf(byte[] data) {
        try {
            org.apache.pdfbox.io.RandomAccessReadBuffer rar = new org.apache.pdfbox.io.RandomAccessReadBuffer(data);
            org.apache.pdfbox.pdmodel.PDDocument doc = org.apache.pdfbox.Loader.loadPDF(rar);
            boolean modified = false;
            float quality = ecoModeEnabled ? 0.45f : 0.60f;

            for (org.apache.pdfbox.pdmodel.PDPage page : doc.getPages()) {
                org.apache.pdfbox.pdmodel.PDResources resources = page.getResources();
                if (resources == null) continue;
                Iterator<org.apache.pdfbox.cos.COSName> it = resources.getXObjectNames().iterator();
                while (it.hasNext()) {
                    org.apache.pdfbox.cos.COSName name = it.next();
                    if (!resources.isImageXObject(name)) continue;
                    org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject img = (org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject) resources.getXObject(name);
                    if (img == null) continue;
                    try {
                        java.awt.image.BufferedImage bi = img.getImage();
                        if (bi == null) continue;
                        org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject compressed =
                                org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory.createFromImage(doc, bi, quality);
                        resources.put(name, compressed);
                        modified = true;
                    } catch (Exception ex) {
                        log.debug("Could not recompress image in PDF: {}", ex.getMessage());
                    }
                }
            }

            if (!modified) {
                doc.close();
                return data;
            }

            java.io.ByteArrayOutputStream baos = new java.io.ByteArrayOutputStream();
            doc.save(baos);
            doc.close();
            byte[] result = baos.toByteArray();
            if (result.length < data.length) {
                log.info("PDF compressed: {} -> {} bytes ({}% reduction)",
                        data.length, result.length,
                        Math.round((1 - (double) result.length / data.length) * 100));
                return result;
            }
            return data;
        } catch (Exception e) {
            log.warn("PDF compression failed: {}", e.getMessage());
            return data;
        }
    }
}
