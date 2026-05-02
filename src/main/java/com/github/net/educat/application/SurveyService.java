package com.github.net.educat.application;

import com.github.net.educat.dto.request.SurveyRequest;
import com.github.net.educat.dto.response.SurveyResponse;
import java.util.List;

public interface SurveyService {
    List<SurveyResponse> findAll();
    SurveyResponse findById(Integer id);
    SurveyResponse save(SurveyRequest request);
    SurveyResponse update(Integer id, SurveyRequest request);
    void delete(Integer id);
    void deleteById(Integer id);
}