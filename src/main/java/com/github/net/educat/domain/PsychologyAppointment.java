package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "psychology_appointments")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class PsychologyAppointment {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "student_id", nullable = false)
    private Integer studentId;

    @Column(name = "professional_name", nullable = false, length = 200)
    private String professionalName;

    @Column(name = "appointment_date", nullable = false)
    private LocalDate appointmentDate;

    @Column(nullable = false, length = 10)
    private String slot;

    @Column(columnDefinition = "TEXT")
    private String reason;

    @Column(nullable = false, length = 20)
    private String status;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "resolution_comment", columnDefinition = "TEXT")
    private String resolutionComment;
}
