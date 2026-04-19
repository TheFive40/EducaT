package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalTime;

@Entity
@Table(name = "courses")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Course {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String name;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "course_code", unique = true, length = 24)
    private String courseCode;
    @Column(name = "default_schedule_day", length = 20)
    private String defaultScheduleDay;
    @Column(name = "default_start_time")
    private LocalTime defaultStartTime;
    @Column(name = "default_end_time")
    private LocalTime defaultEndTime;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "teacher_id")
    private Teacher teacher;
}
