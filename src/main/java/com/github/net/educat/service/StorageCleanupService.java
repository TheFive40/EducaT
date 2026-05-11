package com.github.net.educat.service;

import com.github.net.educat.application.StorageService;
import com.github.net.educat.domain.ActivitySubmission;
import com.github.net.educat.domain.Certificate;
import com.github.net.educat.domain.StoredFile;
import com.github.net.educat.repository.ActivitySubmissionRepository;
import com.github.net.educat.repository.AuditLogRepository;
import com.github.net.educat.repository.CertificateRepository;
import com.github.net.educat.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StorageCleanupService {

    private final StoredFileRepository storedFileRepository;
    private final AuditLogRepository auditLogRepository;
    private final ActivitySubmissionRepository activitySubmissionRepository;
    private final CertificateRepository certificateRepository;
    private final StorageService storageService;

    @Value("${educat.storage.base-path:./educat-uploads}")
    private String basePath;

    @Value("${educat.audit.retention-days:90}")
    private int auditRetentionDays;

    @Value("${educat.submission.retention-days:180}")
    private int submissionRetentionDays;

    @Value("${educat.certificate.retention-days:730}")
    private int certificateRetentionDays;

    @Value("${educat.storage.orphan-cleanup-enabled:true}")
    private boolean orphanCleanupEnabled;

    /**
     * Clean orphaned files every hour
     */
    @Scheduled(cron = "0 0 * * * *")
    public void cleanupOrphanedFiles() {
        if (!orphanCleanupEnabled) return;
        log.info("Starting orphaned files cleanup...");
        var orphaned = storageService.findOrphanedFiles();
        int deleted = 0;
        for (StoredFile file : orphaned) {
            try {
                Path path = Paths.get(file.getStoragePath());
                Files.deleteIfExists(path);
                storedFileRepository.delete(file);
                deleted++;
            } catch (IOException e) {
                log.error("Failed to delete orphaned file: {}", file.getStoragePath(), e);
            }
        }
        if (deleted > 0) {
            log.info("Cleaned up {} orphaned files", deleted);
        }
    }

    /**
     * Delete old activity submissions (after academic period ends).
     * Default: 180 days (6 months) after submission.
     * This removes the actual file content but keeps grade records.
     */
    @Scheduled(cron = "0 30 2 * * *")
    public void cleanupOldSubmissions() {
        log.info("Starting old submissions cleanup...");
        LocalDateTime cutoff = LocalDateTime.now().minusDays(submissionRetentionDays);
        long count = activitySubmissionRepository.countBySubmittedAtBefore(cutoff);
        if (count == 0) {
            log.info("No old submissions to clean");
            return;
        }

        // Delete in batches to avoid memory issues
        Pageable pageable = PageRequest.of(0, 500);
        int totalDeleted = 0;
        int totalFilesCleaned = 0;

        while (true) {
            var submissions = activitySubmissionRepository.findBySubmittedAtBefore(cutoff);
            if (submissions.isEmpty()) break;

            for (ActivitySubmission sub : submissions) {
                // Clear file content but keep the submission record with grade
                if (sub.getFilesJson() != null && !sub.getFilesJson().isEmpty()) {
                    totalFilesCleaned++;
                }
                sub.setFilesJson(null);
                sub.setComment(null);
                activitySubmissionRepository.save(sub);
                totalDeleted++;
            }

            if (submissions.size() < 500) break;
        }

        log.info("Cleaned {} old submissions (removed files from {}), keeping grade records",
                totalDeleted, totalFilesCleaned);
    }

    /**
     * Delete old certificates.
     * Default: 2 years after issuance.
     */
    @Scheduled(cron = "0 0 3 * * 0")
    public void cleanupOldCertificates() {
        log.info("Starting old certificates cleanup...");
        LocalDate cutoff = LocalDate.now().minusDays(certificateRetentionDays);
        long count = certificateRepository.countByIssuedAtBefore(cutoff);
        if (count == 0) {
            log.info("No old certificates to clean");
            return;
        }

        var oldCertificates = certificateRepository.findByIssuedAtBefore(cutoff);
        int deleted = 0;
        for (Certificate cert : oldCertificates) {
            // Delete file reference if stored via StorageService
            if (cert.getFilePath() != null && cert.getFilePath().startsWith("stored:")) {
                try {
                    Integer storedId = Integer.parseInt(cert.getFilePath().replace("stored:", ""));
                    storageService.deleteFileReference(storedId, "CERTIFICATE", String.valueOf(cert.getId()));
                } catch (Exception e) {
                    log.warn("Could not delete stored file for certificate {}: {}", cert.getId(), e.getMessage());
                }
            }
            certificateRepository.delete(cert);
            deleted++;
        }

        log.info("Deleted {} certificates older than {} days", deleted, certificateRetentionDays);
    }

    /**
     * Rotate old audit logs.
     * Default: 90 days.
     */
    @Scheduled(cron = "0 0 3 * * *")
    public void rotateAuditLogs() {
        log.info("Starting audit log rotation...");
        LocalDateTime cutoff = LocalDateTime.now().minusDays(auditRetentionDays);
        Pageable pageable = PageRequest.of(0, 1000, Sort.by("createdAt").ascending());
        int totalDeleted = 0;

        while (true) {
            var oldLogs = auditLogRepository.findByCreatedAtBefore(cutoff, pageable);
            if (oldLogs.isEmpty()) break;

            auditLogRepository.deleteAll(oldLogs.getContent());
            totalDeleted += oldLogs.getNumberOfElements();

            if (!oldLogs.hasNext()) break;
            pageable = oldLogs.nextPageable();
        }

        if (totalDeleted > 0) {
            log.info("Deleted {} audit logs older than {} days", totalDeleted, auditRetentionDays);
        }
    }

    /**
     * Deep cleanup: removes all files with zero references and compacts storage.
     * Runs weekly on Sundays at 4 AM.
     */
    @Scheduled(cron = "0 0 4 * * 0")
    public void deepCleanup() {
        log.info("Starting deep storage cleanup...");
        cleanupOrphanedFiles();

        long beforeSize = storageService.getTotalStorageUsed();
        long beforeFiles = storageService.getTotalFilesCount();

        // Force cleanup any remaining orphaned files
        var orphaned = storedFileRepository.findAll().stream()
                .filter(f -> f.getReferenceCount() == null || f.getReferenceCount() <= 0)
                .toList();

        int deleted = 0;
        for (StoredFile file : orphaned) {
            try {
                Path path = Paths.get(file.getStoragePath());
                Files.deleteIfExists(path);
                storedFileRepository.delete(file);
                deleted++;
            } catch (IOException e) {
                log.error("Failed to delete orphaned file: {}", file.getStoragePath(), e);
            }
        }

        long afterSize = storageService.getTotalStorageUsed();
        long afterFiles = storageService.getTotalFilesCount();

        log.info("Deep cleanup complete. Files: {} -> {}, Size: {} MB -> {} MB, Deleted: {}",
                beforeFiles, afterFiles,
                Math.round(beforeSize / 1024.0 / 1024.0),
                Math.round(afterSize / 1024.0 / 1024.0),
                deleted);
    }
}
