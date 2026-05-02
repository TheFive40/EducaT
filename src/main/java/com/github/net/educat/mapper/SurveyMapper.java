package com.github.net.educat.mapper;

import com.github.net.educat.domain.Survey;
import com.github.net.educat.dto.request.SurveyRequest;
import com.github.net.educat.dto.response.SurveyResponse;
import org.springframework.stereotype.Component;

@Component
public class SurveyMapper {
    public SurveyResponse toResponse(Survey survey) {
        return SurveyResponse.builder()
                .id(survey.getId())
                .question(survey.getQuestion())
                .optionsJson(survey.getOptionsJson())
                .rolesJson(survey.getRolesJson())
                .startsAt(survey.getStartsAt())
                .endsAt(survey.getEndsAt())
                .authRequired(survey.getAuthRequired())
                .questionMediaJson(survey.getQuestionMediaJson())
                .voteLedgerJson(survey.getVoteLedgerJson())
                .status(survey.getStatus())
                .createdAt(survey.getCreatedAt())
                .build();
    }

    public Survey toEntity(SurveyRequest request) {
        return Survey.builder()
                .question(request.getQuestion())
                .optionsJson(request.getOptionsJson())
                .rolesJson(request.getRolesJson())
                .startsAt(request.getStartsAt())
                .endsAt(request.getEndsAt())
                .authRequired(request.getAuthRequired())
                .questionMediaJson(request.getQuestionMediaJson())
                .status(request.getStatus())
                .build();
    }
}