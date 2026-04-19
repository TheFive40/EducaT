package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "wellbeing_requests")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WellbeingRequest {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "module_type", nullable = false, length = 60)
    private String moduleType;

    @Column(nullable = false, length = 180)
    private String title;

    @Column(columnDefinition = "TEXT")
    private String message;

    @Column(name = "payload_json", columnDefinition = "TEXT")
    private String payloadJson;

    @Column(name = "requested_at", nullable = false)
    private LocalDateTime requestedAt;

    @Column(name = "scheduled_at")
    private LocalDateTime scheduledAt;

    @Column(nullable = false, length = 30)
    private String status;

    @Column(name = "resolution_comment", columnDefinition = "TEXT")
    private String resolutionComment;
}

