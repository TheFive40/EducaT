package com.github.net.educat.application;

import com.github.net.educat.dto.request.StudentRequest;
import com.github.net.educat.dto.response.StudentResponse;
import java.util.List;

public interface StudentService {
    List<StudentResponse> findAll();
    StudentResponse findById(Integer id);
    StudentResponse save(StudentRequest request);
    StudentResponse update(Integer id, StudentRequest request);
    void delete(Integer id);
}
