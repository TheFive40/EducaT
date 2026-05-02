package com.github.net.educat.controller;

import com.github.net.educat.application.SurveyService;
import com.github.net.educat.dto.request.SurveyRequest;
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

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        surveyService.delete(id);
        return ResponseEntity.noContent().build();
    }
}