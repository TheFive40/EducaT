package com.github.net.educat.application;

import com.github.net.educat.dto.request.WellbeingRequestCreateRequest;
import com.github.net.educat.dto.request.WellbeingRequestStatusRequest;
import com.github.net.educat.dto.response.WellbeingRequestResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface WellbeingRequestService {
    WellbeingRequestResponse create(WellbeingRequestCreateRequest request);
    WellbeingRequestResponse findById(Integer id);
    Page<WellbeingRequestResponse> findByFilters(Integer studentId, String moduleType, String status, Pageable pageable);
    WellbeingRequestResponse updateStatus(Integer id, WellbeingRequestStatusRequest request);
    void delete(Integer id);
}

