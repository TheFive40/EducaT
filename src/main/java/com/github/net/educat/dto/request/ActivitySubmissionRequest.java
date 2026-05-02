package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.*;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivitySubmissionRequest {
    @NotNull
    private Integer activityId;
    @NotNull
    private Integer studentId;
    private String comment;
    private List<Object> files;
    private Boolean isLate;
    private java.math.BigDecimal grade;
    private String feedback;
}
