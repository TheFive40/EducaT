package com.optical.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateResponse {
    private Integer id;
    private StudentResponse student;
    private String name;
    private String filePath;
}
