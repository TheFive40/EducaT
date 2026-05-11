package com.github.net.educat.dto.request;

import lombok.Data;

@Data
public class StorageSettingsRequest {
    private Long globalLimitBytes;
    private Integer warningThresholdPercent;
    private Integer dangerThresholdPercent;
    private Integer auditRetentionDays;
    private Integer submissionRetentionDays;
    private Integer certificateRetentionDays;
    private Boolean autoCompressionEnabled;
    private Boolean autoDeduplicationEnabled;
    private Boolean ecoModeEnabled;
    private Boolean orphanCleanupEnabled;
}
