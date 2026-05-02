package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EvaluationFormResponse {
    private Integer id;
    private String type;
    private String title;
    private String questionsJson;
}