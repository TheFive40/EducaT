package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.StudentWellbeingRequest;
import com.optical.net.educat.dto.response.StudentWellbeingResponse;
import java.util.List;

public interface StudentWellbeingService {
    List<StudentWellbeingResponse> findAll();
    StudentWellbeingResponse findById(Integer id);
    StudentWellbeingResponse save(StudentWellbeingRequest request);
    void delete(Integer id);
    List<StudentWellbeingResponse> findByStudentId(Integer studentId);
}
