package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThemeRequest {
    @NotBlank
    private String name;
    private String baseColor;
    @NotNull
    private Integer settingsId;
}
