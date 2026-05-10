package com.github.net.educat.service;

import com.github.net.educat.application.AuditLogService;
import com.github.net.educat.domain.AuditLog;
import com.github.net.educat.repository.AuditLogRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
public class AuditLogServiceImpl implements AuditLogService {
    private final AuditLogRepository auditLogRepository;

    @Override
    @Transactional
    public AuditLog log(String actorEmail, String action, String entityType, String entityId, String details) {
        return log(actorEmail, action, entityType, entityId, details, null);
    }

    @Override
    @Transactional
    public AuditLog log(String actorEmail, String action, String entityType, String entityId, String details, String ipAddress) {
        AuditLog entry = AuditLog.builder()
                .actorEmail(actorEmail != null ? actorEmail : "system")
                .action(action)
                .entityType(entityType)
                .entityId(entityId)
                .details(details)
                .ipAddress(ipAddress)
                .createdAt(LocalDateTime.now())
                .build();
        return auditLogRepository.save(entry);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> findAll(Pageable pageable) {
        return auditLogRepository.findAllByOrderByCreatedAtDesc(pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public List<AuditLog> findRecent() {
        return auditLogRepository.findTop50ByOrderByCreatedAtDesc();
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AuditLog> search(String action, String entityType, String actorEmail, LocalDateTime fromDate, LocalDateTime toDate, Pageable pageable) {
        return auditLogRepository.search(action, entityType, actorEmail, fromDate, toDate, pageable);
    }
}
