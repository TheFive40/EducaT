package com.github.net.educat.service;

import com.github.net.educat.application.StorageQuotaService;
import com.github.net.educat.domain.StorageQuota;
import com.github.net.educat.repository.StorageQuotaRepository;
import com.github.net.educat.repository.StoredFileRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Optional;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class StorageQuotaServiceImpl implements StorageQuotaService {

    private final StorageQuotaRepository quotaRepository;
    private final StoredFileRepository storedFileRepository;

    @Value("${educat.storage.global-limit:107374182400}")
    private long globalLimit; // Default 100 GB

    @Value("${educat.storage.default-user-limit:52428800}")
    private long defaultUserLimit; // Default 50 MB per user

    @Override
    public StorageQuota getOrCreateQuota(String ownerType, String ownerId, Long defaultLimit) {
        Optional<StorageQuota> existing = quotaRepository.findByOwnerTypeAndOwnerId(ownerType, ownerId);
        if (existing.isPresent()) {
            return existing.get();
        }
        StorageQuota quota = StorageQuota.builder()
                .ownerType(ownerType)
                .ownerId(ownerId)
                .bytesUsed(0L)
                .bytesLimit(defaultLimit != null ? defaultLimit :
                        ("GLOBAL".equals(ownerType) ? globalLimit : defaultUserLimit))
                .filesCount(0)
                .build();
        return quotaRepository.save(quota);
    }

    @Override
    public void addUsage(String ownerType, String ownerId, long bytes) {
        if (bytes <= 0) return;
        StorageQuota quota = getOrCreateQuota(ownerType, ownerId, null);
        quota.setBytesUsed(quota.getBytesUsed() + bytes);
        quota.setFilesCount(quota.getFilesCount() + 1);
        quota.setUpdatedAt(LocalDateTime.now());
        quotaRepository.save(quota);
    }

    @Override
    public void subtractUsage(String ownerType, String ownerId, long bytes) {
        if (bytes <= 0) return;
        StorageQuota quota = getOrCreateQuota(ownerType, ownerId, null);
        quota.setBytesUsed(Math.max(0, quota.getBytesUsed() - bytes));
        quota.setFilesCount(Math.max(0, quota.getFilesCount() - 1));
        quota.setUpdatedAt(LocalDateTime.now());
        quotaRepository.save(quota);
    }

    @Override
    @Transactional(readOnly = true)
    public boolean hasQuotaAvailable(String ownerType, String ownerId, long requestedBytes) {
        StorageQuota quota = getOrCreateQuota(ownerType, ownerId, null);
        long projected = quota.getBytesUsed() + requestedBytes;
        return projected <= quota.getBytesLimit();
    }

    @Override
    @Transactional(readOnly = true)
    public StorageQuota getGlobalQuota() {
        return getOrCreateQuota("GLOBAL", "INSTITUTION", globalLimit);
    }

    @Override
    public void setGlobalLimit(long bytes) {
        StorageQuota quota = getOrCreateQuota("GLOBAL", "INSTITUTION", bytes);
        quota.setBytesLimit(bytes);
        quotaRepository.save(quota);
    }

    @Override
    public void recalculateAllQuotas() {
        // Recalculate global usage
        long totalBytes = storedFileRepository.findAll().stream()
                .mapToLong(f -> f.getFileSize() != null ? f.getFileSize() : 0L)
                .sum();
        long totalFiles = storedFileRepository.count();

        StorageQuota global = getOrCreateQuota("GLOBAL", "INSTITUTION", globalLimit);
        global.setBytesUsed(totalBytes);
        global.setFilesCount((int) totalFiles);
        global.setUpdatedAt(LocalDateTime.now());
        quotaRepository.save(global);

        log.info("Recalculated storage: {} bytes, {} files", totalBytes, totalFiles);
    }
}
