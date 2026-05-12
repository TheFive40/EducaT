package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArticleResponse {
    private Integer id;
    private String title;
    private String content;
    private String summary;
    private String coverImage;
    private String author;
    private LocalDateTime publishedAt;
    private LocalDateTime createdAt;
}
