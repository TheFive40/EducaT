package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.math.BigDecimal;

@Entity
@Table(name = "grades")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Grade {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    @Column(precision = 5, scale = 2)
    private BigDecimal grade;
    private String description;
}
