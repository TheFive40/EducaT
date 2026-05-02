package com.github.net.educat.application;

import com.github.net.educat.dto.request.AcademicLevelRequest;
import com.github.net.educat.dto.response.AcademicLevelResponse;
import java.util.List;

public interface AcademicLevelService {
    List<AcademicLevelResponse> findAll();
    AcademicLevelResponse findById(Integer id);
    AcademicLevelResponse save(AcademicLevelRequest request);
    AcademicLevelResponse update(Integer id, AcademicLevelRequest request);
    void delete(Integer id);
}