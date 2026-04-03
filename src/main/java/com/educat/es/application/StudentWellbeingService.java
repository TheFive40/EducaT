package com.educat.es.application;

import com.educat.es.dto.request.StudentWellbeingRequest;
import com.educat.es.dto.response.StudentWellbeingResponse;
import java.util.List;

public interface StudentWellbeingService {
    List<StudentWellbeingResponse> findAll();
    StudentWellbeingResponse findById(Integer id);
    StudentWellbeingResponse save(StudentWellbeingRequest request);
    void delete(Integer id);
    List<StudentWellbeingResponse> findByStudentId(Integer studentId);
}
