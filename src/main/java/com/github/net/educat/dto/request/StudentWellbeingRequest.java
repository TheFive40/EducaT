package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentWellbeingRequest {
    @NotNull
    private Integer studentId;
    @NotBlank
    private String type;
    @NotBlank
    private String message;
}
