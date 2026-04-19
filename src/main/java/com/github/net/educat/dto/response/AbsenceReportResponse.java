package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AbsenceReportResponse {
    private Integer id;
    private StudentResponse student;
    private CourseResponse course;
    private LocalDate absenceDate;
    private String reason;
    private String description;
    private List<String> attachments;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime reviewedAt;
    private String reviewComment;
    private Integer reviewerUserId;
}

