package com.educat.es.controller;

import com.educat.es.dto.request.ExamRequest;
import com.educat.es.dto.response.ExamResponse;
import com.educat.es.application.ExamService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<ExamResponse>> findAll() {
        return ResponseEntity.ok(examService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(examService.findById(id));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ExamResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(examService.findByCourseId(courseId));
    }
    @PostMapping
    public ResponseEntity<ExamResponse> save(@Valid @RequestBody ExamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> update(@PathVariable Integer id, @Valid @RequestBody ExamRequest request) {
        return ResponseEntity.ok(examService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        examService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
