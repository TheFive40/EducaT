package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class NewsRequest {
    @NotBlank
    private String title;
    @NotBlank
    private String content;
}
