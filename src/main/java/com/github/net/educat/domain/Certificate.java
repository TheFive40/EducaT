package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDate;

@Entity
@Table(name = "certificates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Certificate {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "student_id", nullable = false)
    private Student student;
    @Column(nullable = false)
    private String name;
    @Column(name = "file_path")
    private String filePath;
    @Column(name = "issued_at")
    private LocalDate issuedAt;
    @Column(nullable = false, length = 20)
    private String status;
}
