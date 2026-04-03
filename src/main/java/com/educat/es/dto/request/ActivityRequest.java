package com.educat.es.dto.request;

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
}
