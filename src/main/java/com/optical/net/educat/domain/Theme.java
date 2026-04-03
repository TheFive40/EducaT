package com.optical.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "themes")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Theme {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String name;
    @Column(name = "base_color")
    private String baseColor;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "settings_id")
    private InstitutionSettings settings;
}
