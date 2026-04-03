package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnrollmentResponse {
    private Integer id;
    private StudentResponse student;
    private CourseResponse course;
    private LocalDateTime enrollmentDate;
}
