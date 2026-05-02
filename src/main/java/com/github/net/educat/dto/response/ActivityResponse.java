package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivityResponse {
    private Integer id;
    private CourseResponse course;
    private String title;
    private String description;
    private LocalDate dueDate;
    private String dueTime;
    private Boolean allowLateSubmission;
    private String visibleFrom;
    private java.util.List<Object> attachments;
    private java.util.List<Object> materials;
}
