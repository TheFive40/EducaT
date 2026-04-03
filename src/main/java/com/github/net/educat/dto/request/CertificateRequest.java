package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateRequest {
    @NotNull
    private Integer studentId;
    @NotBlank
    private String name;
    @NotBlank
    private String filePath;
}
