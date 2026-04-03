package com.educat.es.dto.response;

import lombok.*;
import java.time.LocalTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ScheduleResponse {
    private Integer id;
    private CourseResponse course;
    private String day;
    private LocalTime startTime;
    private LocalTime endTime;
}
