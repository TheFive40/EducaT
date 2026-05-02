package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamResponse {
    private Integer id;
    private CourseResponse course;
    private String title;
    private LocalDate examDate;
    private String examTime;
    private String description;
    private String accessKey;
    private String configJson;
    private String settingsJson;
    private LocalDateTime openAt;
    private LocalDateTime closeAt;
    private Integer maxAttempts;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
    private List<ExamQuestionResponse> questions;
}
