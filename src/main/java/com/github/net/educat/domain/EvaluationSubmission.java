package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "evaluation_submissions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EvaluationSubmission {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(name = "evaluation_type", nullable = false, length = 40)
    private String evaluationType;

    @Column(name = "answers_json", nullable = false, columnDefinition = "TEXT")
    private String answersJson;

    @Column(nullable = false)
    private Boolean submitted;

    @Column(name = "submitted_at")
    private LocalDateTime submittedAt;
    
    // Grading fields
    @Column(name = "grade")
    private Double grade;
    
    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;
    
    @Column(name = "graded_at")
    private LocalDateTime gradedAt;
}

