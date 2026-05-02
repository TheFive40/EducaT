package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityRequest {
    @NotNull
    private Integer courseId;
    @NotBlank
    private String title;
    private String description;
    private LocalDate dueDate;
    private String dueTime;
    private Boolean allowLateSubmission;
    private String visibleFrom;
    private java.util.List<Object> attachments;
    private java.util.List<Object> materials;
}
