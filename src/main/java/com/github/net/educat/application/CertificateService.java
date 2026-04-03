package com.github.net.educat.application;

import com.github.net.educat.dto.request.CertificateRequest;
import com.github.net.educat.dto.response.CertificateResponse;
import java.util.List;

public interface CertificateService {
    List<CertificateResponse> findAll();
    CertificateResponse findById(Integer id);
    CertificateResponse save(CertificateRequest request);
    void delete(Integer id);
    List<CertificateResponse> findByStudentId(Integer studentId);
}
