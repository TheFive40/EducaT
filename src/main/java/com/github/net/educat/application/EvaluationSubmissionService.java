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
    
    // New methods for role-based filtering
    Page<EvaluationSubmissionResponse> findMySubmissions(Integer userId, Integer courseId, String evaluationType, Boolean submitted, Pageable pageable);
    Page<EvaluationSubmissionResponse> findTeacherSubmissions(Integer teacherId, Integer courseId, Integer studentId, String evaluationType, Boolean submitted, Pageable pageable);
    EvaluationSubmissionResponse gradeSubmission(Integer submissionId, Integer teacherId, Double grade, String feedback);
    Integer getStudentIdByUserId(Integer userId);
}

