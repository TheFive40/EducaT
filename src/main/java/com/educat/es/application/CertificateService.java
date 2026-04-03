package com.educat.es.application;

import com.educat.es.dto.request.CertificateRequest;
import com.educat.es.dto.response.CertificateResponse;
import java.util.List;

public interface CertificateService {
    List<CertificateResponse> findAll();
    CertificateResponse findById(Integer id);
    CertificateResponse save(CertificateRequest request);
    void delete(Integer id);
    List<CertificateResponse> findByStudentId(Integer studentId);
}
