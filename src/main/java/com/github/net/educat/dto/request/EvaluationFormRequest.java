package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EvaluationFormRequest {
    @NotBlank
    private String type;
    private String title;
    private String questionsJson;
}