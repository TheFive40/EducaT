package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "activities")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Activity {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @Column(name = "due_date")
    private LocalDate dueDate;
    @Column(name = "due_time")
    private String dueTime;
    @Column(name = "allow_late_submission")
    private Boolean allowLateSubmission;
    @Column(name = "visible_from")
    private String visibleFrom;
    @Column(name = "attachments_json", columnDefinition = "TEXT")
    private String attachmentsJson;
    @Column(name = "materials_json", columnDefinition = "TEXT")
    private String materialsJson;
}
