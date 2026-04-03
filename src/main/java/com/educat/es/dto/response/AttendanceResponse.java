package com.educat.es.dto.response;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceResponse {
    private Integer id;
    private StudentResponse student;
    private CourseResponse course;
    private LocalDate date;
    private Boolean present;
}
