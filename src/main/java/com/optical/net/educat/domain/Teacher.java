package com.optical.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "teachers")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Teacher {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @OneToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id", nullable = false)
    private User user;
    private String specialization;
}
