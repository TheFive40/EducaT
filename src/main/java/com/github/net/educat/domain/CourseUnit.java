package com.github.net.educat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.FetchType;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.JoinColumn;
import jakarta.persistence.ManyToOne;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "course_units")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class CourseUnit {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String welcome;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "announcements_json", columnDefinition = "TEXT")
    private String announcementsJson;

    @Column(name = "activity_ids_json", columnDefinition = "TEXT")
    private String activityIdsJson;

    @Column(name = "exam_ids_json", columnDefinition = "TEXT")
    private String examIdsJson;

    @Column(name = "resources_json", columnDefinition = "TEXT")
    private String resourcesJson;

    @Column(name = "forums_json", columnDefinition = "TEXT")
    private String forumsJson;

    @Column(name = "glossaries_json", columnDefinition = "TEXT")
    private String glossariesJson;
}