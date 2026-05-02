package com.github.net.educat.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeResponse {
    private Integer id;
    private StudentResponse student;
    private CourseResponse course;
    private Integer activityId;
    private Integer sourceUnitId;
    private String source;
    private BigDecimal grade;
    private String description;
}
