package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "activity_submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ActivitySubmission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "activity_id", nullable = false)
    private Activity activity;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @Column(columnDefinition = "TEXT")
    private String comment;

    @Column(name = "files_json", columnDefinition = "TEXT")
    private String filesJson;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;

    @Column
    private Boolean isLate;

    @Column(precision = 5, scale = 2)
    private java.math.BigDecimal grade;

    @Column(columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
}
