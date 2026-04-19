package com.github.net.educat.application;

import com.github.net.educat.dto.request.EvaluationSubmissionRequest;
import com.github.net.educat.dto.response.EvaluationSubmissionResponse;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;

public interface EvaluationSubmissionService {
    EvaluationSubmissionResponse upsert(EvaluationSubmissionRequest request);
    EvaluationSubmissionResponse findById(Integer id);
    Page<EvaluationSubmissionResponse> findByFilters(Integer studentId, Integer courseId, String evaluationType, Boolean submitted, Pageable pageable);
    void delete(Integer id);
}

