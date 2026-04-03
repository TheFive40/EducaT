package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.EnrollmentRequest;
import com.optical.net.educat.dto.response.EnrollmentResponse;
import java.util.List;

public interface EnrollmentService {
    List<EnrollmentResponse> findAll();
    EnrollmentResponse findById(Integer id);
    EnrollmentResponse save(EnrollmentRequest request);
    void delete(Integer id);
    List<EnrollmentResponse> findByStudentId(Integer studentId);
    List<EnrollmentResponse> findByCourseId(Integer courseId);
}
