package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EvaluationSubmissionRequest {
    @NotNull
    private Integer studentId;

    @NotNull
    private Integer courseId;

    @NotBlank
    private String evaluationType;

    @NotNull
    private Map<String, Object> answers;

    private Boolean submitted;
}

