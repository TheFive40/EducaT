package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CourseResponse {
    private Integer id;
    private String name;
    private String description;
    private String courseCode;
    private String defaultScheduleDay;
    private LocalTime defaultStartTime;
    private LocalTime defaultEndTime;
    private String scheduleWarning;
    private TeacherResponse teacher;
}
