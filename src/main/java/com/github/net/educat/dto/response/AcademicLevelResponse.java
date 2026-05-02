package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicLevelResponse {
    private Integer id;
    private String name;
    private String description;
}