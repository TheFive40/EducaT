package com.educat.es.application;

import com.educat.es.dto.request.TeacherRequest;
import com.educat.es.dto.response.TeacherResponse;
import java.util.List;

public interface TeacherService {
    List<TeacherResponse> findAll();
    TeacherResponse findById(Integer id);
    TeacherResponse save(TeacherRequest request);
    TeacherResponse update(Integer id, TeacherRequest request);
    void delete(Integer id);
}
