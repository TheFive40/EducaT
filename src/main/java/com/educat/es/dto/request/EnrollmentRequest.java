package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EnrollmentRequest {
    @NotNull
    private Integer studentId;
    @NotNull
    private Integer courseId;
    private LocalDateTime enrollmentDate;
}
