package com.github.net.educat.dto.response;

import lombok.Builder;
import lombok.Data;

import java.util.List;

@Data
@Builder
public class StorageFileListResponse {
    private List<StorageFileItemResponse> items;
    private int totalCount;
    private int page;
    private int pageSize;
    private int totalPages;
}
