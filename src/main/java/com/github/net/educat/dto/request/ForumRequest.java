package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumRequest {
    @NotBlank
    private String title;
    private String description;
    @NotNull
    private Integer createdById;
}
