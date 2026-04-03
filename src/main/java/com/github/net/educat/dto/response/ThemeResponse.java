package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ThemeResponse {
    private Integer id;
    private String name;
    private String baseColor;
    private InstitutionSettingsResponse settings;
}
