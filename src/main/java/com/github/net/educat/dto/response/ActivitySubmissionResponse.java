package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivitySubmissionResponse {
    private Integer id;
    private ActivityResponse activity;
    private StudentResponse student;
    private String comment;
    private List<Object> files;
    private LocalDateTime submittedAt;
    private Boolean isLate;
    private java.math.BigDecimal grade;
    private String feedback;
    private LocalDateTime gradedAt;
}
