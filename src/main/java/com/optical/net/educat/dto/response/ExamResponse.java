package com.optical.net.educat.dto.response;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamResponse {
    private Integer id;
    private CourseResponse course;
    private String title;
    private LocalDate examDate;
}
