package com.optical.net.educat.mapper;

import com.optical.net.educat.domain.Certificate;
import com.optical.net.educat.dto.request.CertificateRequest;
import com.optical.net.educat.dto.response.CertificateResponse;
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
                .build();
    }
    public Certificate toEntity(CertificateRequest request) {
        return Certificate.builder()
                .name(request.getName())
                .filePath(request.getFilePath())
                .build();
    }
}
