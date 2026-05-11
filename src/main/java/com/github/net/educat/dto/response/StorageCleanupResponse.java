package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StorageCleanupResponse {
    private boolean dryRun;
    private int deletedFiles;
    private long freedBytes;
    private List<String> deletedEntities;
    private List<String> errors;
}
