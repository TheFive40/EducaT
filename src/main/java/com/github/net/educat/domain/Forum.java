package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "forums")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Forum {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String title;
    @Column(columnDefinition = "TEXT")
    private String description;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "created_by")
    private User createdBy;
}
