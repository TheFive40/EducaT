package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamRequest {
    @NotNull
    private Integer courseId;
    @NotBlank
    private String title;
    private LocalDate examDate;
}
