package com.github.net.educat.mapper;

import com.github.net.educat.domain.EvaluationForm;
import com.github.net.educat.dto.request.EvaluationFormRequest;
import com.github.net.educat.dto.response.EvaluationFormResponse;
import org.springframework.stereotype.Component;

@Component
public class EvaluationFormMapper {
    public EvaluationFormResponse toResponse(EvaluationForm form) {
        return EvaluationFormResponse.builder()
                .id(form.getId())
                .type(form.getType())
                .title(form.getTitle())
                .questionsJson(form.getQuestionsJson())
                .build();
    }

    public EvaluationForm toEntity(EvaluationFormRequest request) {
        return EvaluationForm.builder()
                .type(request.getType())
                .title(request.getTitle())
                .questionsJson(request.getQuestionsJson())
                .build();
    }
}