package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "exam_questions")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ExamQuestion {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "exam_id", nullable = false)
    private Exam exam;

    @Column(name = "order_index", nullable = false)
    private Integer orderIndex;

    @Column(name = "question_type", nullable = false, length = 30)
    private String questionType;

    @Column(name = "question_text", columnDefinition = "TEXT")
    private String questionText;

    @Column(name = "options_json", columnDefinition = "TEXT")
    private String optionsJson;

    @Column(name = "correct_answer_json", columnDefinition = "TEXT")
    private String correctAnswerJson;

    @Column(name = "feedback", columnDefinition = "TEXT")
    private String feedback;

    @Column(name = "points", nullable = false)
    private Double points = 1.0;

    @Column(name = "time_limit_seconds")
    private Integer timeLimitSeconds;
}
