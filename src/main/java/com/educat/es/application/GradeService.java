package com.educat.es.application;

import com.educat.es.dto.request.GradeRequest;
import com.educat.es.dto.response.GradeResponse;
import java.util.List;

public interface GradeService {
    List<GradeResponse> findAll();
    GradeResponse findById(Integer id);
    GradeResponse save(GradeRequest request);
    GradeResponse update(Integer id, GradeRequest request);
    void delete(Integer id);
    List<GradeResponse> findByStudentId(Integer studentId);
    List<GradeResponse> findByCourseId(Integer courseId);
}
