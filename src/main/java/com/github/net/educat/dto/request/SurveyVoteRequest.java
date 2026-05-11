package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurveyVoteRequest {
    @NotBlank
    private String optionId;
}
