package com.github.net.educat.application;

import com.github.net.educat.domain.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

import java.time.LocalDateTime;
import java.util.List;

public interface AuditLogService {
    AuditLog log(String actorEmail, String action, String entityType, String entityId, String details);
    AuditLog log(String actorEmail, String action, String entityType, String entityId, String details, String ipAddress);
    Page<AuditLog> findAll(Pageable pageable);
    List<AuditLog> findRecent();
    Page<AuditLog> search(String action, String entityType, String actorEmail, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable);
}
