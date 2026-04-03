package com.optical.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NewsResponse {
    private Integer id;
    private String title;
    private String content;
    private LocalDateTime createdAt;
}
