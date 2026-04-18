package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

import java.time.LocalDate;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateRequest {
    @NotNull
    private Integer studentId;
    @NotBlank
    private String name;
    @NotBlank
    private String filePath;
    private LocalDate issuedAt;
    private String status;
}
