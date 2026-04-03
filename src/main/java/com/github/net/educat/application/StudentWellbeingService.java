package com.github.net.educat.application;

import com.github.net.educat.dto.request.StudentWellbeingRequest;
import com.github.net.educat.dto.response.StudentWellbeingResponse;
import java.util.List;

public interface StudentWellbeingService {
    List<StudentWellbeingResponse> findAll();
    StudentWellbeingResponse findById(Integer id);
    StudentWellbeingResponse save(StudentWellbeingRequest request);
    void delete(Integer id);
    List<StudentWellbeingResponse> findByStudentId(Integer studentId);
}
