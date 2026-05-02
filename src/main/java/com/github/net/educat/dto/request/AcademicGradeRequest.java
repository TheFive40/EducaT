package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicGradeRequest {
    @NotNull
    private Integer levelId;
    @NotBlank
    private String name;
}