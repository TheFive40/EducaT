package com.github.net.educat.controller;

import com.github.net.educat.application.EvaluationFormService;
import com.github.net.educat.dto.request.EvaluationFormRequest;
import com.github.net.educat.dto.response.EvaluationFormResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/evaluation-forms")
@RequiredArgsConstructor
public class EvaluationFormController {
    private final EvaluationFormService evaluationFormService;

    @GetMapping
    public ResponseEntity<List<EvaluationFormResponse>> findAll() {
        return ResponseEntity.ok(evaluationFormService.findAll());
    }

    @GetMapping("/type/{type}")
    public ResponseEntity<List<EvaluationFormResponse>> findByType(@PathVariable String type) {
        return ResponseEntity.ok(evaluationFormService.findByType(type));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluationFormResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(evaluationFormService.findById(id));
    }

    @PostMapping
    public ResponseEntity<EvaluationFormResponse> save(@Valid @RequestBody EvaluationFormRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluationFormService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<EvaluationFormResponse> update(@PathVariable Integer id, @Valid @RequestBody EvaluationFormRequest request) {
        return ResponseEntity.ok(evaluationFormService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        evaluationFormService.delete(id);
        return ResponseEntity.noContent().build();
    }
}