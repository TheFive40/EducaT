package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurveyRequest {
    @NotBlank
    private String question;
    private String optionsJson;
    private String rolesJson;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Boolean authRequired;
    private String questionMediaJson;
    private String status;
}