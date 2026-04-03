package com.optical.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.math.BigDecimal;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GradeRequest {
    @NotNull
    private Integer studentId;
    @NotNull
    private Integer courseId;
    @NotNull @DecimalMin("0.0") @DecimalMax("10.0")
    private BigDecimal grade;
    private String description;
}
