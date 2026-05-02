package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamQuestionResponse {
    private Integer id;
    private Integer orderIndex;
    private String questionType;
    private String questionText;
    private String optionsJson;
    private String correctAnswerJson;
    private String feedback;
    private Double points;
    private Integer timeLimitSeconds;
}
