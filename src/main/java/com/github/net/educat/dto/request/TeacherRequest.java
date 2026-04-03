package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherRequest {
    @NotNull
    private Integer userId;
    private String specialization;
}
