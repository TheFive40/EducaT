package com.educat.es.application;

import com.educat.es.dto.request.EnrollmentRequest;
import com.educat.es.dto.response.EnrollmentResponse;
import java.util.List;

public interface EnrollmentService {
    List<EnrollmentResponse> findAll();
    EnrollmentResponse findById(Integer id);
    EnrollmentResponse save(EnrollmentRequest request);
    void delete(Integer id);
    List<EnrollmentResponse> findByStudentId(Integer studentId);
    List<EnrollmentResponse> findByCourseId(Integer courseId);
}
