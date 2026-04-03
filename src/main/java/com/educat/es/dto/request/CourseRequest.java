package com.educat.es.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseRequest {
    @NotBlank
    private String name;
    private String description;
    @NotNull
    private Integer teacherId;
}
