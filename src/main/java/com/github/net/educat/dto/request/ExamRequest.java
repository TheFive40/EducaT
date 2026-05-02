package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamRequest {
    @NotNull
    private Integer courseId;
    @NotBlank
    private String title;
    private LocalDate examDate;
    private String examTime;
    private String description;
    private String accessKey;
    private String configJson;
    private String settingsJson;
    private String openAt;
    private String closeAt;
    private Integer maxAttempts;
    private List<ExamQuestionRequest> questions;
}
