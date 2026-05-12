package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "academic_articles")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AcademicArticle {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;
    @Column(columnDefinition = "TEXT")
    private String summary;
    private String coverImage;
    private String author;
    @Column(name = "published_at")
    private LocalDateTime publishedAt;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
