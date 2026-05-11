package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.StorageService;
import com.github.net.educat.domain.*;
import com.github.net.educat.repository.*;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class StorageMaintenanceScheduler {

    private final StoredFileRepository storedFileRepository;
    private final FileReferenceRepository fileReferenceRepository;
    private final InstitutionSettingsRepository institutionSettingsRepository;
    private final AuditLogRepository auditLogRepository;
    private final ActivitySubmissionRepository activitySubmissionRepository;
    private final CertificateRepository certificateRepository;
    private final StorageService storageService;

    @Value("${educat.storage.base-path:./educat-uploads}")
    private String basePath;

    @Value("${educat.audit.retention-days:90}")
    private int defaultAuditRetention;

    @Value("${educat.submission.retention-days:180}")
    private int defaultSubmissionRetention;

    @Value("${educat.certificate.retention-days:730}")
    private int defaultCertificateRetention;

    @Scheduled(cron = "0 0 2 * * *")
    @Transactional
    public void runDailyMaintenance() {
        log.info("Starting daily storage maintenance...");

        Map<String, Object> settings = loadSettings();
        boolean orphanCleanup = Boolean.TRUE.equals(settings.getOrDefault("orphanCleanupEnabled", true));
        boolean autoCompress = Boolean.TRUE.equals(settings.getOrDefault("autoCompressionEnabled", true));
        boolean autoDedup = Boolean.TRUE.equals(settings.getOrDefault("autoDeduplicationEnabled", true));
        boolean ecoMode = Boolean.TRUE.equals(settings.getOrDefault("ecoModeEnabled", false));

        int auditDays = ((Number) settings.getOrDefault("auditRetentionDays", defaultAuditRetention)).intValue();
        int submissionDays = ((Number) settings.getOrDefault("submissionRetentionDays", defaultSubmissionRetention)).intValue();
        int certDays = ((Number) settings.getOrDefault("certificateRetentionDays", defaultCertificateRetention)).intValue();

        long totalFreed = 0;

        // 1. Orphan cleanup
        if (orphanCleanup) {
            totalFreed += cleanupOrphanedFiles();
        }

        // 2. Deduplication of existing files (for files stored before hash dedup was implemented)
        if (autoDedup) {
            totalFreed += deduplicateExistingFiles();
        }

        // 3. Compress uncompressed stored files aggressively in eco mode
        if (autoCompress || ecoMode) {
            totalFreed += compressUncompressedFiles(ecoMode);
        }

        // 4. Age-based cleanup
        totalFreed += cleanupOldSubmissions(submissionDays);
        totalFreed += cleanupOldCertificates(certDays);
        totalFreed += cleanupOldAuditLogs(auditDays);

        log.info("Daily storage maintenance complete. Total freed: {} bytes", totalFreed);
    }

    private Map<String, Object> loadSettings() {
        try {
            return institutionSettingsRepository.findAll().stream()
                    .findFirst()
                    .map(s -> {
                        String json = s.getStorageSettingsJson();
                        if (json != null && !json.isBlank()) {
                            try {
                                return new ObjectMapper().readValue(json, new TypeReference<Map<String, Object>>() {});
                            } catch (Exception e) {
                                log.warn("Failed to parse storage settings JSON", e);
                            }
                        }
                        return new HashMap<String, Object>();
                    })
                    .orElse(new HashMap<>());
        } catch (Exception e) {
            log.error("Failed to load storage settings", e);
            return new HashMap<>();
        }
    }

    private long cleanupOrphanedFiles() {
        long freed = 0;
        List<StoredFile> orphans = storedFileRepository.findAll().stream()
                .filter(f -> f.getReferenceCount() == null || f.getReferenceCount() <= 0)
                .toList();
        for (StoredFile f : orphans) {
            long size = f.getFileSize() != null ? f.getFileSize() : 0;
            try {
                Path path = Paths.get(f.getStoragePath());
                Files.deleteIfExists(path);
                storedFileRepository.delete(f);
                freed += size;
                log.debug("Deleted orphaned file: {}", f.getFileName());
            } catch (IOException e) {
                log.error("Failed to delete orphaned file: {}", f.getStoragePath(), e);
            }
        }
        if (freed > 0) {
            log.info("Orphan cleanup freed {} bytes from {} files", freed, orphans.size());
        }
        return freed;
    }

    private long deduplicateExistingFiles() {
        long freed = 0;
        Map<String, StoredFile> hashMap = new LinkedHashMap<>();
        List<StoredFile> duplicates = new ArrayList<>();

        for (StoredFile f : storedFileRepository.findAll()) {
            String hash = f.getFileHash();
            if (hash == null || hash.isBlank()) continue;
            String key = hash + "|" + (f.getFileName() != null ? f.getFileName() : "");
            if (hashMap.containsKey(key)) {
                duplicates.add(f);
            } else {
                hashMap.put(key, f);
            }
        }

        for (StoredFile dup : duplicates) {
            String hash = dup.getFileHash();
            String key = hash + "|" + (dup.getFileName() != null ? dup.getFileName() : "");
            StoredFile original = hashMap.get(key);
            if (original == null) continue;

            // Reassign references
            List<FileReference> refs = fileReferenceRepository.findAll().stream()
                    .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null && r.getStoredFile().getId().equals(dup.getId()))
                    .toList();
            for (FileReference ref : refs) {
                ref.setStoredFile(original);
                fileReferenceRepository.save(ref);
            }

            // Update reference counts
            long originalRefs = fileReferenceRepository.findAll().stream()
                    .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null && r.getStoredFile().getId().equals(original.getId()))
                    .count();
            original.setReferenceCount((int) originalRefs);
            storedFileRepository.save(original);

            // Delete duplicate physical file
            try {
                Path path = Paths.get(dup.getStoragePath());
                Files.deleteIfExists(path);
            } catch (IOException e) {
                log.error("Failed to delete duplicate file: {}", dup.getStoragePath(), e);
            }

            long size = dup.getFileSize() != null ? dup.getFileSize() : 0;
            storedFileRepository.delete(dup);
            freed += size;
        }

        if (freed > 0) {
            log.info("Deduplication freed {} bytes from {} duplicates", freed, duplicates.size());
        }
        return freed;
    }

    private long compressUncompressedFiles(boolean aggressive) {
        long saved = 0;
        // Note: real compression is handled during upload by StorageServiceImpl.
        // This scheduler only logs a recommendation if large uncompressed files are found.
        List<StoredFile> largeFiles = storedFileRepository.findAll().stream()
                .filter(f -> Boolean.FALSE.equals(f.getCompressionEnabled()))
                .filter(f -> f.getFileSize() != null && f.getFileSize() > 1024 * 1024) // > 1MB
                .toList();

        if (!largeFiles.isEmpty()) {
            log.info("Found {} large uncompressed files. Run manual optimize to compress them.", largeFiles.size());
        }
        return saved;
    }

    private long cleanupOldSubmissions(int retentionDays) {
        if (retentionDays <= 0) return 0;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        long freed = 0;
        List<ActivitySubmission> old = activitySubmissionRepository.findAll().stream()
                .filter(s -> s.getSubmittedAt() != null && s.getSubmittedAt().isBefore(cutoff))
                .filter(s -> s.getFilesJson() != null && !s.getFilesJson().isBlank())
                .toList();
        for (ActivitySubmission s : old) {
            s.setFilesJson(null);
            activitySubmissionRepository.save(s);
            freed += 1; // count as 1 logical file cleaned
            log.debug("Cleared old submission files for submission {}", s.getId());
        }
        if (!old.isEmpty()) {
            log.info("Cleared files from {} old activity submissions (retention: {} days)", old.size(), retentionDays);
        }
        return freed;
    }

    private long cleanupOldCertificates(int retentionDays) {
        if (retentionDays <= 0) return 0;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        long freed = 0;
        List<Certificate> old = certificateRepository.findAll().stream()
                .filter(c -> c.getIssuedAt() != null && c.getIssuedAt().isBefore(cutoff.toLocalDate()))
                .filter(c -> c.getFilePath() != null && c.getFilePath().startsWith("data:"))
                .toList();
        for (Certificate c : old) {
            c.setFilePath(null);
            certificateRepository.save(c);
            freed += 1;
            log.debug("Cleared old certificate file for certificate {}", c.getId());
        }
        if (!old.isEmpty()) {
            log.info("Cleared files from {} old certificates (retention: {} days)", old.size(), retentionDays);
        }
        return freed;
    }

    private long cleanupOldAuditLogs(int retentionDays) {
        if (retentionDays <= 0) return 0;
        LocalDateTime cutoff = LocalDateTime.now().minusDays(retentionDays);
        try {
            long countBefore = auditLogRepository.count();
            // This assumes the repository supports deletion by date; if not, we iterate.
            // For safety, we just log a recommendation if too many old logs exist.
            long oldCount = auditLogRepository.findAll().stream()
                    .filter(l -> l.getCreatedAt() != null && l.getCreatedAt().isBefore(cutoff))
                    .count();
            if (oldCount > 1000) {
                log.warn("There are {} audit logs older than {} days. Consider purging them.", oldCount, retentionDays);
            }
            return 0;
        } catch (Exception e) {
            log.error("Error during audit log cleanup", e);
            return 0;
        }
    }
}
