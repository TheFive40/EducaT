package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstitutionSettingsRequest {
    @NotBlank
    private String name;
    private String logo;
    private String primaryColor;
    private String secondaryColor;
    private String banner;
}
