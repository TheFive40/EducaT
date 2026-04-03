package com.educat.es.application;

import com.educat.es.dto.request.ExamRequest;
import com.educat.es.dto.response.ExamResponse;
import java.util.List;

public interface ExamService {
    List<ExamResponse> findAll();
    ExamResponse findById(Integer id);
    ExamResponse save(ExamRequest request);
    ExamResponse update(Integer id, ExamRequest request);
    void delete(Integer id);
    List<ExamResponse> findByCourseId(Integer courseId);
}
