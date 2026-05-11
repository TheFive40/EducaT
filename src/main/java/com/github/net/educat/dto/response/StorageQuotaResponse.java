package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StorageQuotaResponse {
    private String ownerType;
    private String ownerId;
    private long bytesUsed;
    private long bytesLimit;
    private int filesCount;
    private double usagePercent;
}
