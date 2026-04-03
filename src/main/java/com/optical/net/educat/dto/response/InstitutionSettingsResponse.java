package com.optical.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstitutionSettingsResponse {
    private Integer id;
    private String name;
    private String logo;
    private String primaryColor;
    private String secondaryColor;
    private String banner;
}
