package com.github.net.educat.application;

import com.github.net.educat.dto.request.AbsenceReportRequest;
import com.github.net.educat.dto.request.AbsenceReportStatusRequest;
import com.github.net.educat.dto.response.AbsenceReportResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface AbsenceReportService {
    AbsenceReportResponse create(AbsenceReportRequest request);
    AbsenceReportResponse findById(Integer id);
    Page<AbsenceReportResponse> findByFilters(Integer studentId, Integer courseId, String status, Pageable pageable);
    AbsenceReportResponse updateStatus(Integer id, AbsenceReportStatusRequest request);
    void delete(Integer id);
}

