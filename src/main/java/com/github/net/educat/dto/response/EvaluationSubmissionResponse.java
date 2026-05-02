package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EvaluationSubmissionResponse {
    private Integer id;
    private StudentResponse student;
    private CourseResponse course;
    private String evaluationType;
    private Map<String, Object> answers;
    private Boolean submitted;
    private LocalDateTime submittedAt;
    private Double grade;
    private String feedback;
    private LocalDateTime gradedAt;
}

