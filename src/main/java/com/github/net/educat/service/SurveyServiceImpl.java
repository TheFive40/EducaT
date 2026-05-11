package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.SurveyService;
import com.github.net.educat.domain.Survey;
import com.github.net.educat.dto.request.SurveyRequest;
import com.github.net.educat.dto.response.SurveyResponse;
import com.github.net.educat.mapper.SurveyMapper;
import com.github.net.educat.repository.SurveyRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Set;

@Slf4j
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
    public List<SurveyResponse> findActiveSurveysForRole(String roleName) {
        String normalizedRole = String.valueOf(roleName != null ? roleName : "").trim().toUpperCase();
        LocalDateTime now = LocalDateTime.now();
        ObjectMapper mapper = new ObjectMapper();
        return surveyRepository.findAll().stream()
                .filter(s -> {
                    // status active and not closed
                    if ("closed".equalsIgnoreCase(s.getStatus())) return false;
                    // startsAt check
                    if (s.getStartsAt() != null && now.isBefore(s.getStartsAt())) return false;
                    // endsAt check
                    if (s.getEndsAt() != null && now.isAfter(s.getEndsAt())) return false;
                    // role check
                    String rolesJson = s.getRolesJson();
                    if (rolesJson == null || rolesJson.isBlank()) return false;
                    try {
                        List<String> roles = mapper.readValue(rolesJson, new TypeReference<List<String>>() {});
                        Set<String> upperRoles = roles.stream().map(String::trim).map(String::toUpperCase).collect(java.util.stream.Collectors.toSet());
                        // Allow if role matches or NO_ROLE is present (public survey)
                        return upperRoles.contains(normalizedRole) || upperRoles.contains("NO_ROLE");
                    } catch (Exception e) {
                        log.warn("Failed to parse survey roles JSON for survey {}", s.getId(), e);
                        return false;
                    }
                })
                .map(surveyMapper::toResponse)
                .toList();
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
    public SurveyResponse registerVote(Integer id, String optionId, String voterKey) {
        Survey survey = surveyRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Survey not found: " + id));
        ObjectMapper mapper = new ObjectMapper();
        // Parse options
        List<java.util.Map<String, Object>> options;
        try {
            options = mapper.readValue(survey.getOptionsJson() != null ? survey.getOptionsJson() : "[]",
                    new TypeReference<List<java.util.Map<String, Object>>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid options JSON", e);
        }
        // Parse vote ledger
        java.util.Map<String, java.util.Map<String, Object>> ledger;
        try {
            ledger = mapper.readValue(survey.getVoteLedgerJson() != null ? survey.getVoteLedgerJson() : "{}",
                    new TypeReference<java.util.Map<String, java.util.Map<String, Object>>>() {});
        } catch (Exception e) {
            ledger = new java.util.HashMap<>();
        }
        // Check duplicate vote
        if (ledger.containsKey(voterKey)) {
            throw new IllegalStateException("Already voted in this survey");
        }
        // Update option votes
        boolean found = false;
        for (java.util.Map<String, Object> opt : options) {
            if (optionId.equals(String.valueOf(opt.get("id")))) {
                int votes = 0;
                Object v = opt.get("votes");
                if (v instanceof Number) votes = ((Number) v).intValue();
                else if (v != null) try { votes = Integer.parseInt(String.valueOf(v)); } catch (NumberFormatException ignored) {}
                opt.put("votes", votes + 1);
                found = true;
                break;
            }
        }
        if (!found) throw new IllegalArgumentException("Option not found");
        // Update ledger
        java.util.Map<String, Object> entry = new java.util.HashMap<>();
        entry.put("optionId", optionId);
        entry.put("at", java.time.LocalDateTime.now().toString());
        ledger.put(voterKey, entry);
        // Save
        try {
            survey.setOptionsJson(mapper.writeValueAsString(options));
            survey.setVoteLedgerJson(mapper.writeValueAsString(ledger));
        } catch (Exception e) {
            throw new IllegalStateException("Failed to serialize vote data", e);
        }
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