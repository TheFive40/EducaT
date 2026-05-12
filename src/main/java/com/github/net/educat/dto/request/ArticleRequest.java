package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ArticleRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String content;
    private String summary;
    private String coverImage;
    private String author;
}
