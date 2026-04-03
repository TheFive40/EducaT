package com.educat.es.application;

import com.educat.es.dto.request.StudentRequest;
import com.educat.es.dto.response.StudentResponse;
import java.util.List;

public interface StudentService {
    List<StudentResponse> findAll();
    StudentResponse findById(Integer id);
    StudentResponse save(StudentRequest request);
    StudentResponse update(Integer id, StudentRequest request);
    void delete(Integer id);
}
