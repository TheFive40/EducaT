package com.github.net.educat.controller;

import com.github.net.educat.application.SurveyService;
import com.github.net.educat.dto.request.SurveyRequest;
import com.github.net.educat.dto.request.SurveyVoteRequest;
import com.github.net.educat.dto.response.SurveyResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/surveys")
@RequiredArgsConstructor
public class SurveyController {
    private final SurveyService surveyService;

    @GetMapping
    public ResponseEntity<List<SurveyResponse>> findAll() {
        return ResponseEntity.ok(surveyService.findAll());
    }

    @GetMapping("/active-for-role")
    public ResponseEntity<List<SurveyResponse>> findActiveForRole(@RequestParam(value = "role", required = false) String role) {
        return ResponseEntity.ok(surveyService.findActiveSurveysForRole(role));
    }

    @GetMapping("/{id}")
    public ResponseEntity<SurveyResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(surveyService.findById(id));
    }

    @PostMapping
    public ResponseEntity<SurveyResponse> save(@Valid @RequestBody SurveyRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(surveyService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<SurveyResponse> update(@PathVariable Integer id, @Valid @RequestBody SurveyRequest request) {
        return ResponseEntity.ok(surveyService.update(id, request));
    }

    @PostMapping("/{id}/vote")
    public ResponseEntity<?> vote(@PathVariable Integer id, @RequestBody SurveyVoteRequest request, java.security.Principal principal) {
        String optionId = request != null ? request.getOptionId() : null;
        if (optionId == null || optionId.isBlank()) {
            return ResponseEntity.badRequest().body(java.util.Map.of("error", "Missing or blank optionId", "receivedOptionId", String.valueOf(optionId)));
        }
        String voterKey = principal != null ? "usr:" + principal.getName() : "anon:" + java.util.UUID.randomUUID();
        return ResponseEntity.ok(surveyService.registerVote(id, optionId, voterKey));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        surveyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}