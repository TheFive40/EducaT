package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "news")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class News {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String content;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
