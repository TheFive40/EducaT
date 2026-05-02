package com.github.net.educat.service;

import com.github.net.educat.application.EvaluationFormService;
import com.github.net.educat.domain.EvaluationForm;
import com.github.net.educat.dto.request.EvaluationFormRequest;
import com.github.net.educat.dto.response.EvaluationFormResponse;
import com.github.net.educat.mapper.EvaluationFormMapper;
import com.github.net.educat.repository.EvaluationFormRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EvaluationFormServiceImpl implements EvaluationFormService {
    private final EvaluationFormRepository evaluationFormRepository;
    private final EvaluationFormMapper evaluationFormMapper;

    @Override @Transactional(readOnly = true)
    public List<EvaluationFormResponse> findAll() {
        return evaluationFormRepository.findAll().stream().map(evaluationFormMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public List<EvaluationFormResponse> findByType(String type) {
        return evaluationFormRepository.findByType(type).stream().map(evaluationFormMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public EvaluationFormResponse findById(Integer id) {
        return evaluationFormRepository.findById(id).map(evaluationFormMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("EvaluationForm not found: " + id));
    }

    @Override
    public EvaluationFormResponse save(EvaluationFormRequest request) {
        EvaluationForm form = evaluationFormMapper.toEntity(request);
        return evaluationFormMapper.toResponse(evaluationFormRepository.save(form));
    }

    @Override
    public EvaluationFormResponse update(Integer id, EvaluationFormRequest request) {
        EvaluationForm form = evaluationFormRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("EvaluationForm not found: " + id));
        form.setType(request.getType());
        form.setTitle(request.getTitle());
        form.setQuestionsJson(request.getQuestionsJson());
        return evaluationFormMapper.toResponse(evaluationFormRepository.save(form));
    }

    @Override
    public void delete(Integer id) {
        if (!evaluationFormRepository.existsById(id)) throw new EntityNotFoundException("EvaluationForm not found: " + id);
        evaluationFormRepository.deleteById(id);
    }
}