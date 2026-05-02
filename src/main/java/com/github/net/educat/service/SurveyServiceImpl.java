package com.github.net.educat.service;

import com.github.net.educat.application.SurveyService;
import com.github.net.educat.domain.Survey;
import com.github.net.educat.dto.request.SurveyRequest;
import com.github.net.educat.dto.response.SurveyResponse;
import com.github.net.educat.mapper.SurveyMapper;
import com.github.net.educat.repository.SurveyRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class SurveyServiceImpl implements SurveyService {
    private final SurveyRepository surveyRepository;
    private final SurveyMapper surveyMapper;

    @Override @Transactional(readOnly = true)
    public List<SurveyResponse> findAll() {
        return surveyRepository.findAll().stream().map(surveyMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public SurveyResponse findById(Integer id) {
        return surveyRepository.findById(id).map(surveyMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found: " + id));
    }

    @Override
    public SurveyResponse save(SurveyRequest request) {
        Survey survey = surveyMapper.toEntity(request);
        return surveyMapper.toResponse(surveyRepository.save(survey));
    }

    @Override
    public SurveyResponse update(Integer id, SurveyRequest request) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found: " + id));
        survey.setQuestion(request.getQuestion());
        survey.setOptionsJson(request.getOptionsJson());
        survey.setRolesJson(request.getRolesJson());
        survey.setStartsAt(request.getStartsAt());
        survey.setEndsAt(request.getEndsAt());
        survey.setAuthRequired(request.getAuthRequired());
        survey.setQuestionMediaJson(request.getQuestionMediaJson());
        survey.setStatus(request.getStatus());
        return surveyMapper.toResponse(surveyRepository.save(survey));
    }

    @Override
    public void delete(Integer id) {
        if (!surveyRepository.existsById(id)) throw new EntityNotFoundException("Survey not found: " + id);
        surveyRepository.deleteById(id);
    }

    @Override
    public void deleteById(Integer id) {
        surveyRepository.deleteById(id);
    }
}