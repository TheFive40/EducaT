package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;
import java.util.Map;

@Data
@Builder
public class StorageDetailResponse {
    private StorageSummary summary;
    private List<FileTypeStat> byFileType;
    private List<ModuleStat> byModule;
    private List<DailyStat> last7Days;
    private List<Alert> alerts;
    private RetentionConfig retention;
    private List<TopFileStat> topFiles;

    @Data
    @Builder
    public static class StorageSummary {
        private long totalBytesUsed;
        private long totalBytesLimit;
        private double usagePercentage;
        private long totalFiles;
        private long uniqueFiles;
        private long orphanedFiles;
        private long deduplicationSavings;
        private double compressionRatio;
        private long compressedFilesCount;
        private long estimatedOriginalSize;
        private long auditLogsCount;
        private long auditLogsSizeEstimate;
    }

    @Data
    @Builder
    public static class FileTypeStat {
        private String extension;
        private long count;
        private long totalSize;
        private double percentage;
    }

    @Data
    @Builder
    public static class ModuleStat {
        private String entityType;
        private long fileCount;
        private long totalSize;
        private double percentage;
    }

    @Data
    @Builder
    public static class DailyStat {
        private String date;
        private long bytesAdded;
        private long filesAdded;
    }

    @Data
    @Builder
    public static class Alert {
        private String level; // info, warning, danger
        private String title;
        private String message;
    }

    @Data
    @Builder
    public static class RetentionConfig {
        private int auditRetentionDays;
        private int submissionRetentionDays;
        private int certificateRetentionDays;
    }

    @Data
    @Builder
    public static class TopFileStat {
        private Integer storedFileId;
        private String fileName;
        private long storedSize;
        private int referenceCount;
        private double percentage;
        private List<String> entityTypes;
    }
}
