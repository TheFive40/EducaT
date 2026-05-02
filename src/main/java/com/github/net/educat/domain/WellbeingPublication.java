package com.github.net.educat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "wellbeing_publications")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WellbeingPublication {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(name = "section_key", nullable = false, length = 30)
    private String section;

    @Column(nullable = false, length = 20)
    private String type;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(length = 200)
    private String author;

    @Column(length = 20)
    private String date;

    @Column(columnDefinition = "TEXT")
    private String content;

    @Column(name = "video_link", length = 500)
    private String videoLink;

    @Column(name = "reactions_json", columnDefinition = "TEXT")
    private String reactionsJson;
}