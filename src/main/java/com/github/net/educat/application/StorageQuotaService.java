package com.github.net.educat.application;

import com.github.net.educat.domain.StoredFile;
import com.github.net.educat.domain.StorageQuota;

public interface StorageQuotaService {
    StorageQuota getOrCreateQuota(String ownerType, String ownerId, Long defaultLimit);
    void addUsage(String ownerType, String ownerId, long bytes);
    void subtractUsage(String ownerType, String ownerId, long bytes);
    boolean hasQuotaAvailable(String ownerType, String ownerId, long requestedBytes);
    StorageQuota getGlobalQuota();
    void setGlobalLimit(long bytes);
    void recalculateAllQuotas();
}
