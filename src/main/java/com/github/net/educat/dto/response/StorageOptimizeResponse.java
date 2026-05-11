package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StorageOptimizeResponse {
    private int orphanedDeleted;
    private long orphanedFreedBytes;
    private int compressedFiles;
    private long compressionSavedBytes;
    private int duplicatesRemoved;
    private long dedupSavedBytes;
    private long totalFreedBytes;
    private List<String> errors;
}
