package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamAttemptResponse {
    private Integer id;
    private Integer examId;
    private Integer studentId;
    private String studentName;
    private LocalDateTime startedAt;
    private LocalDateTime submittedAt;
    private Double score;
    private String status;
    private String answersJson;
    private String resultsJson;
}
