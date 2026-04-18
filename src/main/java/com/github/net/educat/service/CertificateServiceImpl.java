package com.github.net.educat.service;

import com.github.net.educat.domain.Certificate;
import com.github.net.educat.domain.Student;
import com.github.net.educat.repository.CertificateRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.dto.request.CertificateRequest;
import com.github.net.educat.dto.response.CertificateResponse;
import com.github.net.educat.mapper.CertificateMapper;
import com.github.net.educat.application.CertificateService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.List;
import java.util.Locale;

@Service
@RequiredArgsConstructor
@Transactional
public class CertificateServiceImpl implements CertificateService {
    private final CertificateRepository certificateRepository;
    private final StudentRepository studentRepository;
    private final CertificateMapper certificateMapper;

    @Override @Transactional(readOnly = true)
    public List<CertificateResponse> findAll() {
        return certificateRepository.findAll().stream().map(certificateMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public CertificateResponse findById(Integer id) {
        return certificateRepository.findById(id).map(certificateMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Certificate not found: " + id));
    }
    @Override
    public CertificateResponse save(CertificateRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Certificate certificate = certificateMapper.toEntity(request);
        certificate.setStudent(student);
        if (certificate.getIssuedAt() == null) {
            certificate.setIssuedAt(LocalDate.now());
        }
        certificate.setStatus(normalizeStatus(certificate.getStatus()));
        return certificateMapper.toResponse(certificateRepository.save(certificate));
    }
    @Override
    public void delete(Integer id) {
        if (!certificateRepository.existsById(id)) throw new EntityNotFoundException("Certificate not found: " + id);
        certificateRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<CertificateResponse> findByStudentId(Integer studentId) {
        return certificateRepository.findByStudentId(studentId).stream().map(certificateMapper::toResponse).toList();
    }

    private String normalizeStatus(String rawStatus) {
        String value = (rawStatus == null ? "" : rawStatus).trim().toLowerCase(Locale.ROOT);
        if (value.isBlank()) return "available";
        if (value.equals("pending") || value.equals("approved") || value.equals("rejected") || value.equals("available")) {
            return value;
        }
        return "available";
    }
}
