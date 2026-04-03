package com.optical.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseResponse {
    private Integer id;
    private String name;
    private String description;
    private TeacherResponse teacher;
}
