package com.github.net.educat.application;

import com.github.net.educat.dto.request.EvaluationFormRequest;
import com.github.net.educat.dto.response.EvaluationFormResponse;
import java.util.List;

public interface EvaluationFormService {
    List<EvaluationFormResponse> findAll();
    List<EvaluationFormResponse> findByType(String type);
    EvaluationFormResponse findById(Integer id);
    EvaluationFormResponse save(EvaluationFormRequest request);
    EvaluationFormResponse update(Integer id, EvaluationFormRequest request);
    void delete(Integer id);
}