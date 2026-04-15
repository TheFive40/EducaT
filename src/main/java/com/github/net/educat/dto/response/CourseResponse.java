package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseResponse {
    private Integer id;
    private String name;
    private String description;
    private String courseCode;
    private TeacherResponse teacher;
}
