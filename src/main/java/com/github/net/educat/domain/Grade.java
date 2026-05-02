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
    @Column(name = "activity_id")
    private Integer activityId;
    @Column(name = "source_unit_id")
    private Integer sourceUnitId;
    @Column(length = 30)
    private String source;
    @Column(precision = 5, scale = 2)
    private BigDecimal grade;
    private String description;
}
