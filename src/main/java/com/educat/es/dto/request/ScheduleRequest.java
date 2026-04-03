package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScheduleRequest {
    @NotNull
    private Integer courseId;
    @NotBlank
    private String day;
    @NotNull
    private LocalTime startTime;
    @NotNull
    private LocalTime endTime;
}
