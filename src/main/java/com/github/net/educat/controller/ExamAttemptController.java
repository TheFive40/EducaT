package com.github.net.educat.controller;

import com.github.net.educat.application.ExamAttemptService;
import com.github.net.educat.dto.request.ExamAttemptRequest;
import com.github.net.educat.dto.response.ExamAttemptResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/exam-attempts")
@RequiredArgsConstructor
public class ExamAttemptController {
    private final ExamAttemptService examAttemptService;

    @GetMapping("/start")
    public ResponseEntity<ExamAttemptResponse> startAttempt(@RequestParam Integer examId, @RequestParam Integer studentId) {
        return ResponseEntity.ok(examAttemptService.startAttempt(examId, studentId));
    }

    @PostMapping("/{attemptId}/submit")
    public ResponseEntity<ExamAttemptResponse> submitAttempt(@PathVariable Integer attemptId, @RequestBody ExamAttemptRequest request) {
        return ResponseEntity.ok(examAttemptService.submitAttempt(attemptId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamAttemptResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(examAttemptService.findById(id));
    }

    @GetMapping("/exam/{examId}")
    public ResponseEntity<List<ExamAttemptResponse>> findByExam(@PathVariable Integer examId) {
        return ResponseEntity.ok(examAttemptService.findByExamId(examId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ExamAttemptResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(examAttemptService.findByStudentId(studentId));
    }
}
