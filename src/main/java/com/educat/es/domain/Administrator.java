package com.educat.es.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "administrators")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Administrator {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
}
