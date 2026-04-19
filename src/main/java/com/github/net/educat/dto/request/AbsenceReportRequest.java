package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AbsenceReportRequest {
    @NotNull
    private Integer studentId;

    @NotNull
    private Integer courseId;

    @NotNull
    private LocalDate absenceDate;

    @NotBlank
    @Size(max = 120)
    private String reason;

    @Size(max = 5000)
    private String description;

    private List<String> attachments;
}

