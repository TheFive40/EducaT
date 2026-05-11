package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class StorageSettingsResponse {
    private long globalLimitBytes;
    private int warningThresholdPercent;
    private int dangerThresholdPercent;
    private int auditRetentionDays;
    private int submissionRetentionDays;
    private int certificateRetentionDays;
    private boolean autoCompressionEnabled;
    private boolean autoDeduplicationEnabled;
    private boolean ecoModeEnabled;
    private boolean orphanCleanupEnabled;
}
