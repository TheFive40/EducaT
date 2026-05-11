package com.github.net.educat.application;

import com.github.net.educat.dto.request.SurveyRequest;
import com.github.net.educat.dto.response.SurveyResponse;
import java.util.List;

public interface SurveyService {
    List<SurveyResponse> findAll();
    List<SurveyResponse> findActiveSurveysForRole(String roleName);
    SurveyResponse findById(Integer id);
    SurveyResponse save(SurveyRequest request);
    SurveyResponse update(Integer id, SurveyRequest request);
    SurveyResponse registerVote(Integer id, String optionId, String voterKey);
    void delete(Integer id);
    void deleteById(Integer id);
}