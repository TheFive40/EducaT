package com.github.net.educat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AuditLogResponse {
    private Integer id;
    private LocalDateTime createdAt;
    private String actorEmail;
    private String action;
    private String entityType;
    private String entityId;
    private String details;
    private String ipAddress;
}
