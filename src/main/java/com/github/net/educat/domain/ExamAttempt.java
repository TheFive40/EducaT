package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "exam_attempts")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamAttempt {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(name = "started_at")
    private LocalDateTime startedAt;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column(name = "score")
    private Double score;

    @Column(name = "status", length = 20)
    private String status;

    @Column(name = "answers_json", columnDefinition = "TEXT")
    private String answersJson;

    @PrePersist
    protected void onCreate() {
        startedAt = LocalDateTime.now();
    }
}
