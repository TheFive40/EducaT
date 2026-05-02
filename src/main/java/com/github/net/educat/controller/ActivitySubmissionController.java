package com.github.net.educat.controller;

import com.github.net.educat.application.ActivitySubmissionService;
import com.github.net.educat.dto.request.ActivitySubmissionRequest;
import com.github.net.educat.dto.response.ActivitySubmissionResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/activity-submissions")
@RequiredArgsConstructor
public class ActivitySubmissionController {
    private final ActivitySubmissionService submissionService;

    @GetMapping
    public ResponseEntity<List<ActivitySubmissionResponse>> findAll() {
        return ResponseEntity.ok(submissionService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ActivitySubmissionResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(submissionService.findById(id));
    }

    @GetMapping("/activity/{activityId}")
    public ResponseEntity<List<ActivitySubmissionResponse>> findByActivity(@PathVariable Integer activityId) {
        return ResponseEntity.ok(submissionService.findByActivityId(activityId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ActivitySubmissionResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(submissionService.findByStudentId(studentId));
    }

    @GetMapping("/activity/{activityId}/student/{studentId}")
    public ResponseEntity<ActivitySubmissionResponse> findByActivityAndStudent(@PathVariable Integer activityId, @PathVariable Integer studentId) {
        ActivitySubmissionResponse res = submissionService.findByActivityIdAndStudentId(activityId, studentId);
        return res != null ? ResponseEntity.ok(res) : ResponseEntity.notFound().build();
    }

    @PostMapping
    public ResponseEntity<ActivitySubmissionResponse> save(@Valid @RequestBody ActivitySubmissionRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(submissionService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ActivitySubmissionResponse> update(@PathVariable Integer id, @Valid @RequestBody ActivitySubmissionRequest request) {
        return ResponseEntity.ok(submissionService.update(id, request));
    }

    @PutMapping("/{id}/grade")
    public ResponseEntity<ActivitySubmissionResponse> grade(@PathVariable Integer id, @RequestBody Map<String, Object> body) {
        Double grade = body.get("grade") instanceof Number ? ((Number) body.get("grade")).doubleValue() : null;
        String feedback = body.get("feedback") != null ? body.get("feedback").toString() : null;
        return ResponseEntity.ok(submissionService.grade(id, grade, feedback));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        submissionService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
