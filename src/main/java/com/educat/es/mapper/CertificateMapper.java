package com.educat.es.mapper;

import com.educat.es.domain.Certificate;
import com.educat.es.dto.request.CertificateRequest;
import com.educat.es.dto.response.CertificateResponse;
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
