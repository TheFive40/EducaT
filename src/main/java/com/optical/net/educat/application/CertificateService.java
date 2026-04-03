package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.CertificateRequest;
import com.optical.net.educat.dto.response.CertificateResponse;
import java.util.List;

public interface CertificateService {
    List<CertificateResponse> findAll();
    CertificateResponse findById(Integer id);
    CertificateResponse save(CertificateRequest request);
    void delete(Integer id);
    List<CertificateResponse> findByStudentId(Integer studentId);
}
