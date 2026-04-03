package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "forum_messages")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumMessage {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "forum_id", nullable = false)
    private Forum forum;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    @Column(columnDefinition = "TEXT")
    private String message;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
