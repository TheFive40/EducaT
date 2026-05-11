package com.github.net.educat.application;

import com.github.net.educat.dto.request.CertificateTemplateRequest;
import com.github.net.educat.dto.response.CertificateTemplateResponse;

import java.util.List;
import java.util.Map;

public interface CertificateTemplateService {
    List<CertificateTemplateResponse> findAll();
    CertificateTemplateResponse findById(Integer id);
    CertificateTemplateResponse save(CertificateTemplateRequest request);
    CertificateTemplateResponse update(Integer id, CertificateTemplateRequest request);
    void delete(Integer id);
    byte[] generatePreview(Integer templateId, Integer studentId);
    byte[] generateCertificate(Integer templateId, Integer studentId);
    byte[] generateDocx(Integer templateId, Integer studentId);
    Map<String, Object> massGenerate(Integer templateId, List<Integer> studentIds);
}
