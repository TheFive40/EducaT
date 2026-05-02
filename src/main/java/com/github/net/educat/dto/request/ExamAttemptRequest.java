package com.github.net.educat.dto.request;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamAttemptRequest {
    private Integer examId;
    private Integer studentId;
    private String answersJson;
}
