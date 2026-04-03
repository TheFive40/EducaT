package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.GradeRequest;
import com.optical.net.educat.dto.response.GradeResponse;
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
