package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class StorageFileItemResponse {
    private Integer storedFileId;
    private String fileName;
    private String entityType;
    private String entityId;
    private long sizeBytes;
    private LocalDateTime createdAt;
    private int referenceCount;
    private boolean embedded;
    private List<String> entityTypes;
}
