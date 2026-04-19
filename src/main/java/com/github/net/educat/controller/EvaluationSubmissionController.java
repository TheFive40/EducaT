package com.github.net.educat.controller;

import com.github.net.educat.application.EvaluationSubmissionService;
import com.github.net.educat.dto.request.EvaluationSubmissionRequest;
import com.github.net.educat.dto.response.EvaluationSubmissionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/student/evaluation-submissions", "/api/teacher/evaluation-submissions"})
@RequiredArgsConstructor
public class EvaluationSubmissionController {
    private final EvaluationSubmissionService evaluationSubmissionService;

    @GetMapping
    public ResponseEntity<Page<EvaluationSubmissionResponse>> findByFilters(
            @RequestParam(required = false) Integer studentId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) String evaluationType,
            @RequestParam(required = false) Boolean submitted,
            Pageable pageable
    ) {
        return ResponseEntity.ok(evaluationSubmissionService.findByFilters(studentId, courseId, evaluationType, submitted, pageable));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Page<EvaluationSubmissionResponse>> findByStudent(
            @PathVariable Integer studentId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) String evaluationType,
            @RequestParam(required = false) Boolean submitted,
            Pageable pageable
    ) {
        return ResponseEntity.ok(evaluationSubmissionService.findByFilters(studentId, courseId, evaluationType, submitted, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<EvaluationSubmissionResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(evaluationSubmissionService.findById(id));
    }

    @PostMapping
    public ResponseEntity<EvaluationSubmissionResponse> upsert(@Valid @RequestBody EvaluationSubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluationSubmissionService.upsert(request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        evaluationSubmissionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
