package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "institutional_events")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstitutionalEvent {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String title;
    private String coverImage;
    private String location;
    @Column(name = "event_date")
    private LocalDateTime eventDate;
    @Column(name = "created_at")
    private LocalDateTime createdAt;
}
