package com.educat.es.dto.response;

import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeResponse {
    private Integer id;
    private StudentResponse student;
    private CourseResponse course;
    private BigDecimal grade;
    private String description;
}
