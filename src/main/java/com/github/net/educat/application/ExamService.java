package com.github.net.educat.application;

import com.github.net.educat.dto.request.ExamRequest;
import com.github.net.educat.dto.response.ExamResponse;
import java.util.List;

public interface ExamService {
    List<ExamResponse> findAll();
    ExamResponse findById(Integer id);
    ExamResponse save(ExamRequest request);
    ExamResponse update(Integer id, ExamRequest request);
    void delete(Integer id);
    List<ExamResponse> findByCourseId(Integer courseId);
}
