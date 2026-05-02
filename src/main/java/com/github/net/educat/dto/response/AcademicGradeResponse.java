package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicGradeResponse {
    private Integer id;
    private Integer levelId;
    private String levelName;
    private String name;
}