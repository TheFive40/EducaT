package com.educat.es.service;

import com.educat.es.domain.Certificate;
import com.educat.es.domain.Student;
import com.educat.es.repository.CertificateRepository;
import com.educat.es.repository.StudentRepository;
import com.optical.net.educat.domain.*;
import com.educat.es.dto.request.CertificateRequest;
import com.educat.es.dto.response.CertificateResponse;
import com.educat.es.mapper.CertificateMapper;
import com.optical.net.educat.repository.*;
import com.educat.es.application.CertificateService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

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
}
