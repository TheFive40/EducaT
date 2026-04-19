package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WellbeingRequestResponse {
    private Integer id;
    private StudentResponse student;
    private String moduleType;
    private String title;
    private String message;
    private Map<String, Object> payload;
    private LocalDateTime requestedAt;
    private LocalDateTime scheduledAt;
    private String status;
    private String resolutionComment;
}

