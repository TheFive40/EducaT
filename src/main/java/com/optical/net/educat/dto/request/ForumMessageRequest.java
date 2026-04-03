package com.optical.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumMessageRequest {
    @NotNull
    private Integer forumId;
    @NotNull
    private Integer userId;
    @NotBlank
    private String message;
}
