package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateResponse {
    private Integer id;
    private StudentResponse student;
    private String name;
    private String filePath;
    private LocalDate issuedAt;
    private String status;
}
