package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AttendanceRequest {
    @NotNull
    private Integer studentId;
    @NotNull
    private Integer courseId;
    @NotNull
    private LocalDate date;
    @NotNull
    private Boolean present;
}
