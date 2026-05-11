package com.github.net.educat.controller;

import com.github.net.educat.application.StorageService;
import com.github.net.educat.domain.FileReference;
import com.github.net.educat.domain.StoredFile;
import com.github.net.educat.dto.request.StorageCleanupRequest;
import com.github.net.educat.dto.response.StorageCleanupResponse;
import com.github.net.educat.dto.response.StorageDetailResponse;
import com.github.net.educat.dto.response.StorageFileItemResponse;
import com.github.net.educat.dto.response.*;
import com.github.net.educat.dto.request.*;
import com.github.net.educat.domain.AbsenceReport;
import com.github.net.educat.domain.Activity;
import com.github.net.educat.domain.ActivitySubmission;
import com.github.net.educat.domain.Certificate;
import com.github.net.educat.domain.Guide;
import com.github.net.educat.domain.Survey;
import com.github.net.educat.repository.AbsenceReportRepository;
import com.github.net.educat.repository.ActivityRepository;
import com.github.net.educat.repository.ActivitySubmissionRepository;
import com.github.net.educat.repository.AuditLogRepository;
import com.github.net.educat.repository.CertificateRepository;
import com.github.net.educat.repository.FileReferenceRepository;
import com.github.net.educat.repository.GuideRepository;
import com.github.net.educat.repository.InstitutionSettingsRepository;
import com.github.net.educat.repository.StorageQuotaRepository;
import com.github.net.educat.repository.StoredFileRepository;
import com.github.net.educat.repository.SurveyRepository;
import com.github.net.educat.domain.InstitutionSettings;
import com.github.net.educat.domain.StorageQuota;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardOpenOption;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.*;
import java.util.regex.Matcher;
import java.util.regex.Pattern;
import java.util.stream.Collectors;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.fasterxml.jackson.core.type.TypeReference;

@RestController
@RequestMapping("/api/admin/storage")
@RequiredArgsConstructor
public class StorageController {

    private final StorageService storageService;
    private final StoredFileRepository storedFileRepository;
    private final FileReferenceRepository fileReferenceRepository;
    private final AuditLogRepository auditLogRepository;
    private final CertificateRepository certificateRepository;
    private final SurveyRepository surveyRepository;
    private final GuideRepository guideRepository;
    private final ActivityRepository activityRepository;
    private final ActivitySubmissionRepository activitySubmissionRepository;
    private final AbsenceReportRepository absenceReportRepository;
    private final InstitutionSettingsRepository institutionSettingsRepository;
    private final StorageQuotaRepository storageQuotaRepository;

    @Value("${educat.storage.global-limit:107374182400}")
    private long globalLimit;

    @Value("${educat.audit.retention-days:90}")
    private int auditRetentionDays;

    @Value("${educat.submission.retention-days:180}")
    private int submissionRetentionDays;

    @Value("${educat.certificate.retention-days:730}")
    private int certificateRetentionDays;

    @GetMapping("/stats")
    public ResponseEntity<StorageStatsResponse> getStats() {
        long storedBytes = storageService.getTotalStorageUsed();
        long totalFiles = storageService.getTotalFilesCount();
        long uniqueFiles = storedFileRepository.count();
        long orphaned = storageService.findOrphanedFiles().size();
        long auditCount = auditLogRepository.count();
        long auditSizeEstimate = auditCount * 200;

        EmbeddedBreakdown emb = buildEmbeddedBreakdown();
        long totalBytes = storedBytes + emb.totalBytes();
        totalFiles += emb.totalCount();

        long rawSize = storedFileRepository.findAll().stream()
                .mapToLong(f -> f.getFileSize() * Math.max(1, f.getReferenceCount()))
                .sum();
        long dedupSavings = rawSize - storedBytes;
        long compressedCount = storedFileRepository.findAll().stream()
                .filter(f -> Boolean.TRUE.equals(f.getCompressionEnabled()))
                .count();
        double compressionRatio = storageService.getCompressionRatio();

        var stats = StorageStatsResponse.builder()
                .totalBytesUsed(totalBytes)
                .totalBytesLimit(globalLimit)
                .totalFiles(totalFiles)
                .uniqueFiles(uniqueFiles)
                .orphanedFiles(orphaned)
                .usagePercentage(totalBytes * 100.0 / globalLimit)
                .auditLogsCount(auditCount)
                .auditLogsSizeEstimate(auditSizeEstimate)
                .deduplicationSavings(Math.max(0, dedupSavings))
                .compressionRatio(compressionRatio)
                .compressedFilesCount(compressedCount)
                .estimatedOriginalSize(rawSize)
                .build();

        return ResponseEntity.ok(stats);
    }

    @GetMapping("/details")
    public ResponseEntity<StorageDetailResponse> getDetailedStats() {
        List<StoredFile> allFiles = storedFileRepository.findAll();
        List<FileReference> allRefs = fileReferenceRepository.findAll();
        long storedBytes = allFiles.stream().mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L).sum();
        long storedFiles = allFiles.size();
        long orphaned = allFiles.stream().filter(f -> f.getReferenceCount() == null || f.getReferenceCount() <= 0).count();
        long auditCount = auditLogRepository.count();

        EmbeddedBreakdown emb = buildEmbeddedBreakdown();
        long totalBytes = storedBytes + emb.totalBytes();
        long totalFiles = storedFiles + emb.totalCount();

        long rawSize = allFiles.stream().mapToLong(f -> f.getFileSize() * Math.max(1, f.getReferenceCount())).sum();
        long dedupSavings = rawSize - storedBytes;
        long compressedCount = allFiles.stream().filter(f -> Boolean.TRUE.equals(f.getCompressionEnabled())).count();

        var summary = StorageDetailResponse.StorageSummary.builder()
                .totalBytesUsed(totalBytes)
                .totalBytesLimit(globalLimit)
                .usagePercentage(totalBytes * 100.0 / globalLimit)
                .totalFiles(totalFiles)
                .uniqueFiles(storedFiles)
                .orphanedFiles(orphaned)
                .deduplicationSavings(Math.max(0, dedupSavings))
                .compressionRatio(storageService.getCompressionRatio())
                .compressedFilesCount(compressedCount)
                .estimatedOriginalSize(rawSize)
                .auditLogsCount(auditCount)
                .auditLogsSizeEstimate(auditCount * 200)
                .build();

        Map<String, List<StoredFile>> byExt = allFiles.stream()
                .collect(Collectors.groupingBy(f -> {
                    String name = f.getFileName() != null ? f.getFileName() : "";
                    int dot = name.lastIndexOf('.');
                    return dot > 0 ? name.substring(dot + 1).toLowerCase() : "unknown";
                }));

        List<StorageDetailResponse.FileTypeStat> fileTypeStats = byExt.entrySet().stream()
                .map(e -> {
                    long size = e.getValue().stream().mapToLong(StoredFile::getFileSize).sum();
                    return StorageDetailResponse.FileTypeStat.builder()
                            .extension(e.getKey())
                            .count(e.getValue().size())
                            .totalSize(size)
                            .percentage(totalBytes > 0 ? size * 100.0 / totalBytes : 0)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getTotalSize(), a.getTotalSize()))
                .limit(10)
                .collect(Collectors.toList());

        Map<String, List<FileReference>> byEntity = allRefs.stream()
                .collect(Collectors.groupingBy(r -> r.getEntityType() != null ? r.getEntityType() : "UNKNOWN"));

        Map<String, StorageDetailResponse.ModuleStat> moduleMap = new LinkedHashMap<>();
        for (var e : byEntity.entrySet()) {
            long size = e.getValue().stream()
                    .mapToLong(r -> r.getStoredFile() != null && r.getStoredFile().getFileSize() != null
                            ? r.getStoredFile().getFileSize() : 0L)
                    .sum();
            moduleMap.put(e.getKey(), StorageDetailResponse.ModuleStat.builder()
                    .entityType(e.getKey())
                    .fileCount(e.getValue().size())
                    .totalSize(size)
                    .percentage(0)
                    .build());
        }
        for (var e : emb.bytesByEntity().entrySet()) {
            String key = e.getKey();
            long size = e.getValue();
            long count = emb.countByEntity().getOrDefault(key, 0L);
            moduleMap.merge(key,
                    StorageDetailResponse.ModuleStat.builder()
                            .entityType(key)
                            .fileCount((int) count)
                            .totalSize(size)
                            .percentage(0)
                            .build(),
                    (existing, neu) -> {
                        existing.setFileCount(existing.getFileCount() + neu.getFileCount());
                        existing.setTotalSize(existing.getTotalSize() + neu.getTotalSize());
                        return existing;
                    });
        }
        List<StorageDetailResponse.ModuleStat> moduleStats = new ArrayList<>(moduleMap.values());
        for (var m : moduleStats) {
            m.setPercentage(totalBytes > 0 ? m.getTotalSize() * 100.0 / totalBytes : 0);
        }
        moduleStats.sort((a, b) -> Long.compare(b.getTotalSize(), a.getTotalSize()));

        Map<Integer, List<FileReference>> refsByFileId = allRefs.stream()
                .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null)
                .collect(Collectors.groupingBy(r -> r.getStoredFile().getId()));

        List<StorageDetailResponse.TopFileStat> storedTopFiles = allFiles.stream()
                .map(f -> {
                    long size = f.getFileSize() != null ? f.getFileSize() : 0L;
                    List<FileReference> refs = refsByFileId.getOrDefault(f.getId(), List.of());
                    List<String> entityTypes = refs.stream()
                            .map(r -> r.getEntityType() != null ? r.getEntityType() : "UNKNOWN")
                            .distinct()
                            .sorted()
                            .toList();
                    return StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(f.getId())
                            .fileName(f.getFileName())
                            .storedSize(size)
                            .referenceCount(refs.size())
                            .percentage(totalBytes > 0 ? size * 100.0 / totalBytes : 0)
                            .entityTypes(entityTypes)
                            .build();
                })
                .sorted((a, b) -> Long.compare(b.getStoredSize(), a.getStoredSize()))
                .collect(Collectors.toList());

        List<StorageDetailResponse.TopFileStat> combinedTop = new ArrayList<>(storedTopFiles);
        combinedTop.addAll(emb.topFiles());
        combinedTop.sort((a, b) -> Long.compare(b.getStoredSize(), a.getStoredSize()));
        if (combinedTop.size() > 10) combinedTop = combinedTop.subList(0, 10);
        for (var t : combinedTop) {
            t.setPercentage(totalBytes > 0 ? t.getStoredSize() * 100.0 / totalBytes : 0);
        }

        DateTimeFormatter formatter = DateTimeFormatter.ofPattern("yyyy-MM-dd");
        List<StorageDetailResponse.DailyStat> dailyStats = new ArrayList<>();
        for (int i = 6; i >= 0; i--) {
            LocalDate date = LocalDate.now().minusDays(i);
            LocalDateTime start = date.atStartOfDay();
            LocalDateTime end = date.plusDays(1).atStartOfDay();

            var dayFiles = allFiles.stream()
                    .filter(f -> f.getCreatedAt() != null
                            && !f.getCreatedAt().isBefore(start)
                            && f.getCreatedAt().isBefore(end))
                    .toList();

            long bytes = dayFiles.stream().mapToLong(StoredFile::getFileSize).sum();
            dailyStats.add(StorageDetailResponse.DailyStat.builder()
                    .date(date.format(formatter))
                    .bytesAdded(bytes)
                    .filesAdded(dayFiles.size())
                    .build());
        }

        // Read thresholds from settings if available
        int warnThreshold = 75;
        int dangerThreshold = 90;
        try {
            InstitutionSettings inst = getOrCreateInstitutionSettings();
            String json = inst.getStorageSettingsJson();
            if (json != null && !json.isBlank()) {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> map = mapper.readValue(json, new TypeReference<>() {});
                warnThreshold = ((Number) map.getOrDefault("warningThresholdPercent", 75)).intValue();
                dangerThreshold = ((Number) map.getOrDefault("dangerThresholdPercent", 90)).intValue();
            }
        } catch (Exception e) {
            // ignore, use defaults
        }

        List<StorageDetailResponse.Alert> alerts = new ArrayList<>();
        double pct = totalBytes * 100.0 / globalLimit;
        if (pct >= dangerThreshold) {
            alerts.add(StorageDetailResponse.Alert.builder()
                    .level("danger")
                    .title("Almacenamiento crítico")
                    .message("El uso está al " + String.format("%.1f", pct) + "%. Es urgente liberar espacio o aumentar el plan.")
                    .build());
        } else if (pct >= warnThreshold) {
            alerts.add(StorageDetailResponse.Alert.builder()
                    .level("warning")
                    .title("Almacenamiento alto")
                    .message("El uso está al " + String.format("%.1f", pct) + "%. Considere limpieza manual.")
                    .build());
        }
        if (orphaned > 10) {
            alerts.add(StorageDetailResponse.Alert.builder()
                    .level("info")
                    .title("Archivos huérfanos")
                    .message("Hay " + orphaned + " archivos sin referencias que se limpiarán automáticamente.")
                    .build());
        }
        if (dedupSavings > 1024 * 1024 * 1024L) {
            alerts.add(StorageDetailResponse.Alert.builder()
                    .level("success")
                    .title("Deduplicación activa")
                    .message("Se han ahorrado " + formatBytes(dedupSavings) + " gracias a la deduplicación.")
                    .build());
        }

        var retention = StorageDetailResponse.RetentionConfig.builder()
                .auditRetentionDays(auditRetentionDays)
                .submissionRetentionDays(submissionRetentionDays)
                .certificateRetentionDays(certificateRetentionDays)
                .build();

        var response = StorageDetailResponse.builder()
                .summary(summary)
                .byFileType(fileTypeStats)
                .byModule(moduleStats)
                .last7Days(dailyStats)
                .alerts(alerts)
                .retention(retention)
                .topFiles(combinedTop)
                .build();

        return ResponseEntity.ok(response);
    }

    @GetMapping("/files")
    public ResponseEntity<StorageFileListResponse> listFiles(
            @RequestParam(required = false) List<String> modules,
            @RequestParam(required = false) Long minSizeBytes,
            @RequestParam(required = false) Integer olderThanDays,
            @RequestParam(required = false, defaultValue = "true") Boolean includeOrphaned,
            @RequestParam(required = false, defaultValue = "true") Boolean includeEmbedded,
            @RequestParam(required = false, defaultValue = "1") int page,
            @RequestParam(required = false, defaultValue = "20") int pageSize) {

        List<StorageFileItemResponse> result = new ArrayList<>();
        LocalDateTime cutoff = olderThanDays != null ? LocalDateTime.now().minusDays(olderThanDays) : null;

        Set<String> moduleFilter = modules != null ? new HashSet<>(modules.stream().map(String::toUpperCase).toList()) : null;

        // Stored files (orphaned)
        if (includeOrphaned) {
            for (StoredFile f : storedFileRepository.findAll()) {
                boolean isOrphan = f.getReferenceCount() == null || f.getReferenceCount() <= 0;
                if (!isOrphan) continue;
                long size = f.getFileSize() != null ? f.getFileSize() : 0;
                if (minSizeBytes != null && size < minSizeBytes) continue;
                if (cutoff != null && f.getCreatedAt() != null && !f.getCreatedAt().isBefore(cutoff)) continue;

                result.add(StorageFileItemResponse.builder()
                        .storedFileId(f.getId())
                        .fileName(f.getFileName())
                        .entityType("ORPHANED")
                        .entityId(String.valueOf(f.getId()))
                        .sizeBytes(size)
                        .createdAt(f.getCreatedAt())
                        .referenceCount(0)
                        .embedded(false)
                        .entityTypes(List.of("ORPHANED"))
                        .build());
            }
        }

        // File references (non-orphan stored files)
        for (FileReference ref : fileReferenceRepository.findAll()) {
            StoredFile f = ref.getStoredFile();
            if (f == null) continue;
            String entityType = ref.getEntityType() != null ? ref.getEntityType() : "UNKNOWN";
            if (moduleFilter != null && !moduleFilter.contains(entityType.toUpperCase())) continue;
            long size = f.getFileSize() != null ? f.getFileSize() : 0;
            if (minSizeBytes != null && size < minSizeBytes) continue;
            if (cutoff != null && f.getCreatedAt() != null && !f.getCreatedAt().isBefore(cutoff)) continue;

            result.add(StorageFileItemResponse.builder()
                    .storedFileId(f.getId())
                    .fileName(f.getFileName())
                    .entityType(entityType)
                    .entityId(ref.getEntityId())
                    .sizeBytes(size)
                    .createdAt(f.getCreatedAt())
                    .referenceCount(f.getReferenceCount() != null ? f.getReferenceCount() : 0)
                    .embedded(false)
                    .entityTypes(List.of(entityType))
                    .build());
        }

        // Embedded files
        if (includeEmbedded) {
            EmbeddedBreakdown emb = buildEmbeddedBreakdown();
            for (var item : emb.fileItems()) {
                if (moduleFilter != null && !moduleFilter.contains(item.getEntityType().toUpperCase())) continue;
                if (minSizeBytes != null && item.getSizeBytes() < minSizeBytes) continue;
                result.add(item);
            }
        }

        result.sort((a, b) -> Long.compare(b.getSizeBytes(), a.getSizeBytes()));

        int totalCount = result.size();
        int effectivePageSize = Math.max(1, Math.min(pageSize, 200));
        int totalPages = Math.max(1, (int) Math.ceil((double) totalCount / effectivePageSize));
        int effectivePage = Math.max(1, Math.min(page, totalPages));
        int start = (effectivePage - 1) * effectivePageSize;
        int end = Math.min(start + effectivePageSize, totalCount);
        List<StorageFileItemResponse> pageItems = start < totalCount ? result.subList(start, end) : List.of();

        return ResponseEntity.ok(StorageFileListResponse.builder()
                .items(pageItems)
                .totalCount(totalCount)
                .page(effectivePage)
                .pageSize(effectivePageSize)
                .totalPages(totalPages)
                .build());
    }

    @PostMapping("/cleanup")
    public ResponseEntity<StorageCleanupResponse> cleanup(@RequestBody StorageCleanupRequest request) {
        boolean dryRun = request.getDryRun() != null && request.getDryRun();
        Set<String> moduleFilter = request.getModules() != null
                ? new HashSet<>(request.getModules().stream().map(String::toUpperCase).toList())
                : new HashSet<>();
        Long minSize = request.getMinSizeBytes();
        LocalDateTime cutoff = request.getOlderThanDays() != null ? LocalDateTime.now().minusDays(request.getOlderThanDays()) : null;

        int deletedFiles = 0;
        long freedBytes = 0;
        List<String> deletedEntities = new ArrayList<>();
        List<String> errors = new ArrayList<>();

        // Orphaned cleanup
        if (request.getIncludeOrphaned() != null && request.getIncludeOrphaned()) {
            for (StoredFile f : storedFileRepository.findAll()) {
                boolean isOrphan = f.getReferenceCount() == null || f.getReferenceCount() <= 0;
                if (!isOrphan) continue;
                long size = f.getFileSize() != null ? f.getFileSize() : 0;
                if (minSize != null && size < minSize) continue;
                if (cutoff != null && f.getCreatedAt() != null && !f.getCreatedAt().isBefore(cutoff)) continue;

                if (!dryRun) {
                    try {
                        Path path = Paths.get(f.getStoragePath());
                        Files.deleteIfExists(path);
                        storedFileRepository.delete(f);
                    } catch (IOException e) {
                        errors.add("Failed to delete orphaned file: " + f.getFileName());
                        continue;
                    }
                }
                deletedFiles++;
                freedBytes += size;
                deletedEntities.add("ORPHANED:" + f.getFileName());
            }
        }

        // Embedded cleanup by module
        if (request.getIncludeEmbedded() != null && request.getIncludeEmbedded()) {
            if (moduleFilter.isEmpty() || moduleFilter.contains("CERTIFICATE")) {
                for (Certificate cert : certificateRepository.findAll()) {
                    String fp = cert.getFilePath();
                    if (fp != null && fp.startsWith("data:")) {
                        if (!dryRun) {
                            cert.setFilePath(null);
                            certificateRepository.save(cert);
                        }
                        deletedFiles++;
                        freedBytes += estimateDataUrlBytes(fp);
                        deletedEntities.add("CERTIFICATE:" + cert.getName());
                    }
                }
            }

            if (moduleFilter.isEmpty() || moduleFilter.contains("SURVEY")) {
                for (Survey survey : surveyRepository.findAll()) {
                    long before = estimateDataUrlBytes(survey.getQuestionMediaJson()) + estimateDataUrlBytes(survey.getOptionsJson());
                    if (before > 0) {
                        if (!dryRun) {
                            survey.setQuestionMediaJson(null);
                            survey.setOptionsJson(null);
                            surveyRepository.save(survey);
                        }
                        deletedFiles++;
                        freedBytes += before;
                        deletedEntities.add("SURVEY:" + survey.getQuestion());
                    }
                }
            }

            if (moduleFilter.isEmpty() || moduleFilter.contains("GUIDE")) {
                for (Guide guide : guideRepository.findAll()) {
                    String att = guide.getAttachmentsJson();
                    if (att != null && !att.isBlank()) {
                        if (!dryRun) {
                            guide.setAttachmentsJson(null);
                            guideRepository.save(guide);
                        }
                        deletedFiles++;
                        freedBytes += estimateDataUrlBytes(att);
                        deletedEntities.add("GUIDE:" + guide.getTitle());
                    }
                }
            }

            if (moduleFilter.isEmpty() || moduleFilter.contains("ACTIVITY")) {
                for (Activity activity : activityRepository.findAll()) {
                    long before = estimateDataUrlBytes(activity.getAttachmentsJson()) + estimateDataUrlBytes(activity.getMaterialsJson());
                    if (before > 0) {
                        if (!dryRun) {
                            activity.setAttachmentsJson(null);
                            activity.setMaterialsJson(null);
                            activityRepository.save(activity);
                        }
                        deletedFiles++;
                        freedBytes += before;
                        deletedEntities.add("ACTIVITY:" + activity.getTitle());
                    }
                }
            }

            if (moduleFilter.isEmpty() || moduleFilter.contains("ABSENCE_REPORT")) {
                for (AbsenceReport report : absenceReportRepository.findAll()) {
                    String att = report.getAttachmentsJson();
                    if (att != null && !att.isBlank()) {
                        if (!dryRun) {
                            report.setAttachmentsJson(null);
                            absenceReportRepository.save(report);
                        }
                        deletedFiles++;
                        freedBytes += estimateDataUrlBytes(att);
                        deletedEntities.add("ABSENCE_REPORT:" + report.getReason());
                    }
                }
            }

            if (moduleFilter.isEmpty() || moduleFilter.contains("ACTIVITY_SUBMISSION")) {
                for (ActivitySubmission submission : activitySubmissionRepository.findAll()) {
                    String fj = submission.getFilesJson();
                    if (fj != null && !fj.isBlank()) {
                        if (!dryRun) {
                            submission.setFilesJson(null);
                            activitySubmissionRepository.save(submission);
                        }
                        deletedFiles++;
                        freedBytes += estimateDataUrlBytes(fj);
                        deletedEntities.add("ACTIVITY_SUBMISSION:#" + submission.getId());
                    }
                }
            }
        }

        // Stored file references cleanup by module
        if (!moduleFilter.isEmpty() && moduleFilter.contains("ORPHANED") == false) {
            for (FileReference ref : new ArrayList<>(fileReferenceRepository.findAll())) {
                String entityType = ref.getEntityType() != null ? ref.getEntityType() : "UNKNOWN";
                if (!moduleFilter.contains(entityType.toUpperCase())) continue;
                StoredFile f = ref.getStoredFile();
                if (f == null) continue;
                long size = f.getFileSize() != null ? f.getFileSize() : 0;
                if (minSize != null && size < minSize) continue;
                if (cutoff != null && f.getCreatedAt() != null && !f.getCreatedAt().isBefore(cutoff)) continue;

                if (!dryRun) {
                    try {
                        storageService.deleteFileReference(f.getId(), entityType, ref.getEntityId());
                    } catch (Exception e) {
                        errors.add("Failed to delete reference: " + f.getFileName() + " -> " + e.getMessage());
                        continue;
                    }
                }
                deletedFiles++;
                freedBytes += size;
                deletedEntities.add(entityType + ":" + f.getFileName());
            }
        }

        var response = StorageCleanupResponse.builder()
                .dryRun(dryRun)
                .deletedFiles(deletedFiles)
                .freedBytes(freedBytes)
                .deletedEntities(deletedEntities)
                .errors(errors)
                .build();

        return ResponseEntity.ok(response);
    }

    @PostMapping("/cleanup/orphaned")
    public ResponseEntity<StorageCleanupResponse> cleanupOrphaned() {
        int deletedFiles = 0;
        long freedBytes = 0;
        List<String> errors = new ArrayList<>();

        for (StoredFile f : storedFileRepository.findAll()) {
            boolean isOrphan = f.getReferenceCount() == null || f.getReferenceCount() <= 0;
            if (!isOrphan) continue;
            long size = f.getFileSize() != null ? f.getFileSize() : 0;
            try {
                Path path = Paths.get(f.getStoragePath());
                Files.deleteIfExists(path);
                storedFileRepository.delete(f);
                deletedFiles++;
                freedBytes += size;
            } catch (IOException e) {
                errors.add("Failed to delete orphaned file: " + f.getFileName());
            }
        }

        var response = StorageCleanupResponse.builder()
                .dryRun(false)
                .deletedFiles(deletedFiles)
                .freedBytes(freedBytes)
                .deletedEntities(List.of())
                .errors(errors)
                .build();

        return ResponseEntity.ok(response);
    }

    private static final Pattern DATA_URL_PATTERN = Pattern.compile("data:[^\\s\"']+");

    private record DataUrlItem(String url, long size) {}

    private List<DataUrlItem> extractDataUrls(String text) {
        List<DataUrlItem> list = new ArrayList<>();
        if (text == null || text.isBlank()) return list;
        Matcher m = DATA_URL_PATTERN.matcher(text);
        while (m.find()) {
            String url = m.group();
            int comma = url.indexOf(',');
            if (comma < 0) continue;
            String header = url.substring(0, comma);
            String payload = url.substring(comma + 1);
            long size;
            if (header.contains("base64")) {
                int pad = 0;
                if (payload.endsWith("==")) pad = 2;
                else if (payload.endsWith("=")) pad = 1;
                size = (payload.length() * 3L / 4L) - pad;
            } else {
                size = payload.getBytes(StandardCharsets.UTF_8).length;
            }
            list.add(new DataUrlItem(url, size));
        }
        return list;
    }

    private long estimateDataUrlBytes(String text) {
        return extractDataUrls(text).stream().mapToLong(DataUrlItem::size).sum();
    }

    private record EmbeddedBreakdown(long totalBytes, long totalCount,
                                     Map<String, Long> bytesByEntity,
                                     Map<String, Long> countByEntity,
                                     List<StorageDetailResponse.TopFileStat> topFiles,
                                     List<StorageFileItemResponse> fileItems) {}

    private EmbeddedBreakdown buildEmbeddedBreakdown() {
        long totalBytes = 0;
        long totalCount = 0;
        Map<String, Long> bytesByEntity = new HashMap<>();
        Map<String, Long> countByEntity = new HashMap<>();
        List<StorageDetailResponse.TopFileStat> topFiles = new ArrayList<>();
        List<StorageFileItemResponse> fileItems = new ArrayList<>();

        for (Certificate cert : certificateRepository.findAll()) {
            String fp = cert.getFilePath();
            if (fp != null && fp.startsWith("data:")) {
                for (var item : extractDataUrls(fp)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("CERTIFICATE", item.size(), Long::sum);
                    countByEntity.merge("CERTIFICATE", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(cert.getName() != null ? cert.getName() : "Certificate #" + cert.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("CERTIFICATE"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(cert.getName() != null ? cert.getName() : "Certificate #" + cert.getId())
                            .entityType("CERTIFICATE")
                            .entityId(String.valueOf(cert.getId()))
                            .sizeBytes(item.size())
                            .createdAt(null)
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("CERTIFICATE"))
                            .build());
                }
            }
        }

        for (Survey survey : surveyRepository.findAll()) {
            String qm = survey.getQuestionMediaJson();
            if (qm != null) {
                for (var item : extractDataUrls(qm)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("SURVEY", item.size(), Long::sum);
                    countByEntity.merge("SURVEY", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(survey.getQuestion() != null ? survey.getQuestion() : "Survey #" + survey.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("SURVEY"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(survey.getQuestion() != null ? survey.getQuestion() : "Survey #" + survey.getId())
                            .entityType("SURVEY")
                            .entityId(String.valueOf(survey.getId()))
                            .sizeBytes(item.size())
                            .createdAt(survey.getCreatedAt())
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("SURVEY"))
                            .build());
                }
            }
            String opt = survey.getOptionsJson();
            if (opt != null) {
                for (var item : extractDataUrls(opt)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("SURVEY", item.size(), Long::sum);
                    countByEntity.merge("SURVEY", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(survey.getQuestion() != null ? survey.getQuestion() : "Survey #" + survey.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("SURVEY"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(survey.getQuestion() != null ? survey.getQuestion() : "Survey #" + survey.getId())
                            .entityType("SURVEY")
                            .entityId(String.valueOf(survey.getId()))
                            .sizeBytes(item.size())
                            .createdAt(survey.getCreatedAt())
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("SURVEY"))
                            .build());
                }
            }
        }

        for (Guide guide : guideRepository.findAll()) {
            String att = guide.getAttachmentsJson();
            if (att != null) {
                for (var item : extractDataUrls(att)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("GUIDE", item.size(), Long::sum);
                    countByEntity.merge("GUIDE", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(guide.getTitle() != null ? guide.getTitle() : "Guide #" + guide.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("GUIDE"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(guide.getTitle() != null ? guide.getTitle() : "Guide #" + guide.getId())
                            .entityType("GUIDE")
                            .entityId(String.valueOf(guide.getId()))
                            .sizeBytes(item.size())
                            .createdAt(null)
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("GUIDE"))
                            .build());
                }
            }
        }

        for (Activity activity : activityRepository.findAll()) {
            String att = activity.getAttachmentsJson();
            if (att != null) {
                for (var item : extractDataUrls(att)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("ACTIVITY", item.size(), Long::sum);
                    countByEntity.merge("ACTIVITY", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(activity.getTitle() != null ? activity.getTitle() : "Activity #" + activity.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("ACTIVITY"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(activity.getTitle() != null ? activity.getTitle() : "Activity #" + activity.getId())
                            .entityType("ACTIVITY")
                            .entityId(String.valueOf(activity.getId()))
                            .sizeBytes(item.size())
                            .createdAt(null)
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("ACTIVITY"))
                            .build());
                }
            }
            String mat = activity.getMaterialsJson();
            if (mat != null) {
                for (var item : extractDataUrls(mat)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("ACTIVITY", item.size(), Long::sum);
                    countByEntity.merge("ACTIVITY", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(activity.getTitle() != null ? activity.getTitle() : "Activity #" + activity.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("ACTIVITY"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(activity.getTitle() != null ? activity.getTitle() : "Activity #" + activity.getId())
                            .entityType("ACTIVITY")
                            .entityId(String.valueOf(activity.getId()))
                            .sizeBytes(item.size())
                            .createdAt(null)
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("ACTIVITY"))
                            .build());
                }
            }
        }

        for (AbsenceReport report : absenceReportRepository.findAll()) {
            String att = report.getAttachmentsJson();
            if (att != null) {
                for (var item : extractDataUrls(att)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("ABSENCE_REPORT", item.size(), Long::sum);
                    countByEntity.merge("ABSENCE_REPORT", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName(report.getReason() != null ? report.getReason() : "Absence #" + report.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("ABSENCE_REPORT"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName(report.getReason() != null ? report.getReason() : "Absence #" + report.getId())
                            .entityType("ABSENCE_REPORT")
                            .entityId(String.valueOf(report.getId()))
                            .sizeBytes(item.size())
                            .createdAt(report.getCreatedAt())
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("ABSENCE_REPORT"))
                            .build());
                }
            }
        }

        for (ActivitySubmission submission : activitySubmissionRepository.findAll()) {
            String fj = submission.getFilesJson();
            if (fj != null) {
                for (var item : extractDataUrls(fj)) {
                    totalBytes += item.size();
                    totalCount++;
                    bytesByEntity.merge("ACTIVITY_SUBMISSION", item.size(), Long::sum);
                    countByEntity.merge("ACTIVITY_SUBMISSION", 1L, Long::sum);
                    topFiles.add(StorageDetailResponse.TopFileStat.builder()
                            .storedFileId(null)
                            .fileName("Submission #" + submission.getId())
                            .storedSize(item.size())
                            .referenceCount(1)
                            .percentage(0)
                            .entityTypes(List.of("ACTIVITY_SUBMISSION"))
                            .build());
                    fileItems.add(StorageFileItemResponse.builder()
                            .storedFileId(null)
                            .fileName("Submission #" + submission.getId())
                            .entityType("ACTIVITY_SUBMISSION")
                            .entityId(String.valueOf(submission.getId()))
                            .sizeBytes(item.size())
                            .createdAt(submission.getSubmittedAt())
                            .referenceCount(1)
                            .embedded(true)
                            .entityTypes(List.of("ACTIVITY_SUBMISSION"))
                            .build());
                }
            }
        }

        return new EmbeddedBreakdown(totalBytes, totalCount, bytesByEntity, countByEntity, topFiles, fileItems);
    }

    // Settings helpers
    private InstitutionSettings getOrCreateInstitutionSettings() {
        return institutionSettingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> institutionSettingsRepository.save(
                        InstitutionSettings.builder().name("default").build()));
    }

    @GetMapping("/settings")
    public ResponseEntity<StorageSettingsResponse> getSettings() {
        InstitutionSettings settings = getOrCreateInstitutionSettings();
        String json = settings.getStorageSettingsJson();
        if (json != null && !json.isBlank()) {
            try {
                ObjectMapper mapper = new ObjectMapper();
                Map<String, Object> map = mapper.readValue(json, new TypeReference<>() {});
                return ResponseEntity.ok(StorageSettingsResponse.builder()
                        .globalLimitBytes(((Number) map.getOrDefault("globalLimitBytes", globalLimit)).longValue())
                        .warningThresholdPercent(((Number) map.getOrDefault("warningThresholdPercent", 75)).intValue())
                        .dangerThresholdPercent(((Number) map.getOrDefault("dangerThresholdPercent", 90)).intValue())
                        .auditRetentionDays(((Number) map.getOrDefault("auditRetentionDays", auditRetentionDays)).intValue())
                        .submissionRetentionDays(((Number) map.getOrDefault("submissionRetentionDays", submissionRetentionDays)).intValue())
                        .certificateRetentionDays(((Number) map.getOrDefault("certificateRetentionDays", certificateRetentionDays)).intValue())
                        .autoCompressionEnabled(Boolean.TRUE.equals(map.get("autoCompressionEnabled")))
                        .autoDeduplicationEnabled(Boolean.TRUE.equals(map.get("autoDeduplicationEnabled")))
                        .ecoModeEnabled(Boolean.TRUE.equals(map.get("ecoModeEnabled")))
                        .orphanCleanupEnabled(Boolean.TRUE.equals(map.getOrDefault("orphanCleanupEnabled", true)))
                        .build());
            } catch (Exception e) {
                // fallback to defaults
            }
        }
        return ResponseEntity.ok(StorageSettingsResponse.builder()
                .globalLimitBytes(globalLimit)
                .warningThresholdPercent(75)
                .dangerThresholdPercent(90)
                .auditRetentionDays(auditRetentionDays)
                .submissionRetentionDays(submissionRetentionDays)
                .certificateRetentionDays(certificateRetentionDays)
                .autoCompressionEnabled(true)
                .autoDeduplicationEnabled(true)
                .ecoModeEnabled(false)
                .orphanCleanupEnabled(true)
                .build());
    }

    @PostMapping("/settings")
    public ResponseEntity<StorageSettingsResponse> saveSettings(@RequestBody StorageSettingsRequest request) {
        InstitutionSettings settings = getOrCreateInstitutionSettings();
        Map<String, Object> map = new LinkedHashMap<>();
        if (request.getGlobalLimitBytes() != null) map.put("globalLimitBytes", request.getGlobalLimitBytes());
        if (request.getWarningThresholdPercent() != null) map.put("warningThresholdPercent", request.getWarningThresholdPercent());
        if (request.getDangerThresholdPercent() != null) map.put("dangerThresholdPercent", request.getDangerThresholdPercent());
        if (request.getAuditRetentionDays() != null) map.put("auditRetentionDays", request.getAuditRetentionDays());
        if (request.getSubmissionRetentionDays() != null) map.put("submissionRetentionDays", request.getSubmissionRetentionDays());
        if (request.getCertificateRetentionDays() != null) map.put("certificateRetentionDays", request.getCertificateRetentionDays());
        if (request.getAutoCompressionEnabled() != null) map.put("autoCompressionEnabled", request.getAutoCompressionEnabled());
        if (request.getAutoDeduplicationEnabled() != null) map.put("autoDeduplicationEnabled", request.getAutoDeduplicationEnabled());
        if (request.getEcoModeEnabled() != null) map.put("ecoModeEnabled", request.getEcoModeEnabled());
        if (request.getOrphanCleanupEnabled() != null) map.put("orphanCleanupEnabled", request.getOrphanCleanupEnabled());
        try {
            ObjectMapper mapper = new ObjectMapper();
            settings.setStorageSettingsJson(mapper.writeValueAsString(map));
        } catch (Exception e) {
            // ignore serialization errors
        }
        institutionSettingsRepository.save(settings);
        return getSettings();
    }

    @PostMapping("/optimize")
    public ResponseEntity<StorageOptimizeResponse> optimize() {
        int orphanedDeleted = 0;
        long orphanedFreed = 0L;
        int compressedFiles = 0;
        long compressionSaved = 0L;
        int duplicatesRemoved = 0;
        long dedupSaved = 0L;
        List<String> errors = new ArrayList<>();

        // 1. Orphaned cleanup
        for (StoredFile f : new ArrayList<>(storedFileRepository.findAll())) {
            boolean isOrphan = f.getReferenceCount() == null || f.getReferenceCount() <= 0;
            if (!isOrphan) continue;
            long size = f.getFileSize() != null ? f.getFileSize() : 0;
            try {
                Path path = Paths.get(f.getStoragePath());
                Files.deleteIfExists(path);
                storedFileRepository.delete(f);
                orphanedDeleted++;
                orphanedFreed += size;
            } catch (IOException e) {
                errors.add("Failed to delete orphaned: " + f.getFileName());
            }
        }

        // 2. Compress uncompressed PDFs with PDFBox
        for (StoredFile f : storedFileRepository.findAll()) {
            if (Boolean.TRUE.equals(f.getCompressionEnabled())) continue;
            String name = f.getFileName() != null ? f.getFileName().toLowerCase() : "";
            if (name.endsWith(".pdf")) {
                long before = f.getFileSize() != null ? f.getFileSize() : 0;
                try {
                    Path path = Paths.get(f.getStoragePath());
                    byte[] original = Files.readAllBytes(path);
                    byte[] compressed = storageService.compressPdf(original);
                    if (compressed.length < original.length) {
                        Files.write(path, compressed, StandardOpenOption.CREATE, StandardOpenOption.TRUNCATE_EXISTING);
                        f.setFileSize((long) compressed.length);
                        storedFileRepository.save(f);
                        compressedFiles++;
                        compressionSaved += (original.length - compressed.length);
                    }
                } catch (Exception e) {
                    errors.add("Failed to compress PDF: " + f.getFileName() + " -> " + e.getMessage());
                }
            }
        }

        // 3. Deduplication by fileName + size
        Map<String, StoredFile> seen = new LinkedHashMap<>();
        for (StoredFile f : new ArrayList<>(storedFileRepository.findAll())) {
            String key = (f.getFileName() != null ? f.getFileName() : "") + "|" + (f.getFileSize() != null ? f.getFileSize() : 0);
            if (seen.containsKey(key)) {
                StoredFile original = seen.get(key);
                List<FileReference> refs = fileReferenceRepository.findAll().stream()
                        .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null && r.getStoredFile().getId().equals(f.getId()))
                        .toList();
                for (FileReference ref : refs) {
                    ref.setStoredFile(original);
                    fileReferenceRepository.save(ref);
                }
                long refCount = fileReferenceRepository.findAll().stream()
                        .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null && r.getStoredFile().getId().equals(original.getId()))
                        .count();
                original.setReferenceCount((int) refCount);
                storedFileRepository.save(original);
                try {
                    Path path = Paths.get(f.getStoragePath());
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    errors.add("Failed to delete duplicate: " + f.getFileName());
                }
                long size = f.getFileSize() != null ? f.getFileSize() : 0;
                storedFileRepository.delete(f);
                duplicatesRemoved++;
                dedupSaved += size;
            } else {
                seen.put(key, f);
            }
        }

        long totalFreed = orphanedFreed + compressionSaved + dedupSaved;
        return ResponseEntity.ok(StorageOptimizeResponse.builder()
                .orphanedDeleted(orphanedDeleted)
                .orphanedFreedBytes(orphanedFreed)
                .compressedFiles(compressedFiles)
                .compressionSavedBytes(compressionSaved)
                .duplicatesRemoved(duplicatesRemoved)
                .dedupSavedBytes(dedupSaved)
                .totalFreedBytes(totalFreed)
                .errors(errors)
                .build());
    }

    @PostMapping("/compress")
    public ResponseEntity<StorageOptimizeResponse> compress() {
        int compressedFiles = 0;
        long compressionSaved = 0L;
        List<String> errors = new ArrayList<>();
        for (StoredFile f : storedFileRepository.findAll()) {
            if (Boolean.TRUE.equals(f.getCompressionEnabled())) continue;
            String name = f.getFileName() != null ? f.getFileName().toLowerCase() : "";
            if (name.endsWith(".pdf")) {
                long before = f.getFileSize() != null ? f.getFileSize() : 0;
                try {
                    java.nio.file.Path path = java.nio.file.Paths.get(f.getStoragePath());
                    byte[] original = java.nio.file.Files.readAllBytes(path);
                    byte[] compressed = storageService.compressPdf(original);
                    if (compressed.length < original.length) {
                        java.nio.file.Files.write(path, compressed, java.nio.file.StandardOpenOption.CREATE, java.nio.file.StandardOpenOption.TRUNCATE_EXISTING);
                        f.setFileSize((long) compressed.length);
                        storedFileRepository.save(f);
                        compressedFiles++;
                        compressionSaved += (original.length - compressed.length);
                    }
                } catch (Exception e) {
                    errors.add("Failed to compress PDF: " + f.getFileName() + " -> " + e.getMessage());
                }
            }
        }
        return ResponseEntity.ok(StorageOptimizeResponse.builder()
                .compressedFiles(compressedFiles)
                .compressionSavedBytes(compressionSaved)
                .totalFreedBytes(compressionSaved)
                .errors(errors)
                .build());
    }

    @PostMapping("/dedup")
    public ResponseEntity<StorageOptimizeResponse> dedup() {
        int duplicatesRemoved = 0;
        long dedupSaved = 0L;
        List<String> errors = new ArrayList<>();
        Map<String, StoredFile> seen = new LinkedHashMap<>();
        for (StoredFile f : new ArrayList<>(storedFileRepository.findAll())) {
            String key = (f.getFileName() != null ? f.getFileName() : "") + "|" + (f.getFileSize() != null ? f.getFileSize() : 0);
            if (seen.containsKey(key)) {
                StoredFile original = seen.get(key);
                List<FileReference> refs = fileReferenceRepository.findAll().stream()
                        .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null && r.getStoredFile().getId().equals(f.getId()))
                        .toList();
                for (FileReference ref : refs) {
                    ref.setStoredFile(original);
                    fileReferenceRepository.save(ref);
                }
                long refCount = fileReferenceRepository.findAll().stream()
                        .filter(r -> r.getStoredFile() != null && r.getStoredFile().getId() != null && r.getStoredFile().getId().equals(original.getId()))
                        .count();
                original.setReferenceCount((int) refCount);
                storedFileRepository.save(original);
                try {
                    Path path = Paths.get(f.getStoragePath());
                    Files.deleteIfExists(path);
                } catch (IOException e) {
                    errors.add("Failed to delete duplicate: " + f.getFileName());
                }
                long size = f.getFileSize() != null ? f.getFileSize() : 0;
                storedFileRepository.delete(f);
                duplicatesRemoved++;
                dedupSaved += size;
            } else {
                seen.put(key, f);
            }
        }
        return ResponseEntity.ok(StorageOptimizeResponse.builder()
                .duplicatesRemoved(duplicatesRemoved)
                .dedupSavedBytes(dedupSaved)
                .totalFreedBytes(dedupSaved)
                .errors(errors)
                .build());
    }

    @GetMapping("/quotas")
    public ResponseEntity<List<StorageQuotaResponse>> getQuotas() {
        List<StorageQuota> quotas = storageQuotaRepository.findAll().stream()
                .filter(q -> "MODULE".equals(q.getOwnerType()))
                .toList();
        List<StorageQuotaResponse> result = quotas.stream().map(q -> StorageQuotaResponse.builder()
                .ownerType(q.getOwnerType())
                .ownerId(q.getOwnerId())
                .bytesUsed(q.getBytesUsed() != null ? q.getBytesUsed() : 0L)
                .bytesLimit(q.getBytesLimit() != null ? q.getBytesLimit() : 0L)
                .filesCount(q.getFilesCount() != null ? q.getFilesCount() : 0)
                .usagePercent(q.getBytesLimit() != null && q.getBytesLimit() > 0 ? q.getBytesUsed() * 100.0 / q.getBytesLimit() : 0)
                .build()).toList();
        return ResponseEntity.ok(result);
    }

    @PostMapping("/quotas")
    public ResponseEntity<StorageQuotaResponse> saveQuota(@RequestBody StorageQuotaResponse request) {
        Optional<StorageQuota> opt = storageQuotaRepository.findByOwnerTypeAndOwnerId(request.getOwnerType(), request.getOwnerId());
        StorageQuota q = opt.orElseGet(() -> StorageQuota.builder().ownerType(request.getOwnerType()).ownerId(request.getOwnerId()).build());
        q.setBytesLimit(request.getBytesLimit());
        q.setUpdatedAt(LocalDateTime.now());
        storageQuotaRepository.save(q);
        return ResponseEntity.ok(StorageQuotaResponse.builder()
                .ownerType(q.getOwnerType())
                .ownerId(q.getOwnerId())
                .bytesUsed(q.getBytesUsed() != null ? q.getBytesUsed() : 0L)
                .bytesLimit(q.getBytesLimit() != null ? q.getBytesLimit() : 0L)
                .filesCount(q.getFilesCount() != null ? q.getFilesCount() : 0)
                .usagePercent(q.getBytesLimit() != null && q.getBytesLimit() > 0 ? q.getBytesUsed() * 100.0 / q.getBytesLimit() : 0)
                .build());
    }

    private String formatBytes(long bytes) {
        if (bytes < 1024) return bytes + " B";
        if (bytes < 1024 * 1024) return String.format("%.1f KB", bytes / 1024.0);
        if (bytes < 1024L * 1024 * 1024) return String.format("%.1f MB", bytes / (1024.0 * 1024));
        return String.format("%.2f GB", bytes / (1024.0 * 1024 * 1024));
    }
}
