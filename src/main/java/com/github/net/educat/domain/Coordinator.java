package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "coordinators")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Coordinator {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
