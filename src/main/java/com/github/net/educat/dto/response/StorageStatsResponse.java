package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StorageStatsResponse {
    private long totalBytesUsed;
    private long totalBytesLimit;
    private long totalFiles;
    private long uniqueFiles;
    private long orphanedFiles;
    private double usagePercentage;
    private long auditLogsCount;
    private long auditLogsSizeEstimate;
    private long deduplicationSavings;
    private double compressionRatio;
    private long compressedFilesCount;
    private long estimatedOriginalSize;
}
