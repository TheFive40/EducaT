package com.github.net.educat.dto.response;

import lombok.*;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseJoinByCodeResponse {
    private boolean success;
    private String status;
    private String message;
    private CourseResponse course;
}

