package com.educat.es.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "student_wellbeing")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentWellbeing {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    private String type;
    @Column(columnDefinition = "TEXT")
    private String message;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
