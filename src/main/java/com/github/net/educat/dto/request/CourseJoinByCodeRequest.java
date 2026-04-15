package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseJoinByCodeRequest {
    @NotBlank
    private String courseCode;
    @NotNull
    private Integer userId;
    @NotBlank
    private String role;
}

