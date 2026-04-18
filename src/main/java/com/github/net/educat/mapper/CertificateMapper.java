package com.github.net.educat.mapper;

import com.github.net.educat.domain.Certificate;
import com.github.net.educat.dto.request.CertificateRequest;
import com.github.net.educat.dto.response.CertificateResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CertificateMapper {
    private final StudentMapper studentMapper;

    public CertificateResponse toResponse(Certificate certificate) {
        return CertificateResponse.builder()
                .id(certificate.getId())
                .student(certificate.getStudent() != null ? studentMapper.toResponse(certificate.getStudent()) : null)
                .name(certificate.getName())
                .filePath(certificate.getFilePath())
                .issuedAt(certificate.getIssuedAt())
                .status(certificate.getStatus())
                .build();
    }
    public Certificate toEntity(CertificateRequest request) {
        return Certificate.builder()
                .name(request.getName())
                .filePath(request.getFilePath())
                .issuedAt(request.getIssuedAt())
                .status(request.getStatus())
                .build();
    }
}
