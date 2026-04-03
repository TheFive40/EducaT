package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentRequest {
    @NotNull
    private Integer userId;
    @NotBlank
    private String studentCode;
}
