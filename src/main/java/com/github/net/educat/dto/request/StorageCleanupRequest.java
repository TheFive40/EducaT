package com.github.net.educat.dto.request;

import lombok.Data;

import java.util.List;

@Data
public class StorageCleanupRequest {
    private List<String> modules;
    private Long minSizeBytes;
    private Integer olderThanDays;
    private Boolean includeOrphaned;
    private Boolean includeEmbedded;
    private Boolean dryRun;
}
