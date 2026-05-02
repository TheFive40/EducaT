package com.github.net.educat.application;

import com.github.net.educat.dto.request.AcademicGradeRequest;
import com.github.net.educat.dto.response.AcademicGradeResponse;
import java.util.List;

public interface AcademicGradeService {
    List<AcademicGradeResponse> findAll();
    List<AcademicGradeResponse> findByLevelId(Integer levelId);
    AcademicGradeResponse findById(Integer id);
    AcademicGradeResponse save(AcademicGradeRequest request);
    AcademicGradeResponse update(Integer id, AcademicGradeRequest request);
    void delete(Integer id);
}