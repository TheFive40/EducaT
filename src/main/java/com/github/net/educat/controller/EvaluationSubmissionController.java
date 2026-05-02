package com.github.net.educat.controller;

import com.github.net.educat.application.EvaluationSubmissionService;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.EvaluationSubmissionRequest;
import com.github.net.educat.dto.response.EvaluationSubmissionResponse;
import com.github.net.educat.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.security.Principal;

@RestController
@RequiredArgsConstructor
public class EvaluationSubmissionController {
    private final EvaluationSubmissionService evaluationSubmissionService;
    private final UserRepository userRepository;

    // STUDENT ENDPOINTS
    @GetMapping("/api/student/evaluation-submissions")
    public ResponseEntity<Page<EvaluationSubmissionResponse>> findMySubmissions(
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) String evaluationType,
            @RequestParam(required = false) Boolean submitted,
            Pageable pageable,
            Principal principal
    ) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(evaluationSubmissionService.findMySubmissions(user.getId(), courseId, evaluationType, submitted, pageable));
    }

    @PostMapping("/api/student/evaluation-submissions")
    public ResponseEntity<EvaluationSubmissionResponse> submitEvaluation(
            @Valid @RequestBody EvaluationSubmissionRequest request,
            Principal principal
    ) {
        User user = resolveUser(principal);
        request.setStudentId(evaluationSubmissionService.getStudentIdByUserId(user.getId()));
        return ResponseEntity.status(HttpStatus.CREATED).body(evaluationSubmissionService.upsert(request));
    }

    // TEACHER ENDPOINTS
    @GetMapping("/api/teacher/evaluation-submissions")
    public ResponseEntity<Page<EvaluationSubmissionResponse>> findTeacherSubmissions(
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) Integer studentId,
            @RequestParam(required = false) String evaluationType,
            @RequestParam(required = false) Boolean submitted,
            Pageable pageable,
            Principal principal
    ) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(evaluationSubmissionService.findTeacherSubmissions(
                user.getId(), courseId, studentId, evaluationType, submitted, pageable
        ));
    }

    @PutMapping("/api/teacher/evaluation-submissions/{id}/grade")
    public ResponseEntity<EvaluationSubmissionResponse> gradeSubmission(
            @PathVariable Integer id,
            @RequestBody GradeRequest request,
            Principal principal
    ) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(evaluationSubmissionService.gradeSubmission(id, user.getId(), request.getGrade(), request.getFeedback()));
    }

    @GetMapping("/api/evaluation-submissions/{id}")
    public ResponseEntity<EvaluationSubmissionResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(evaluationSubmissionService.findById(id));
    }

    @DeleteMapping("/api/evaluation-submissions/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        evaluationSubmissionService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private User resolveUser(Principal principal) {
        String email = principal != null ? principal.getName() : "";
        return userRepository.findByEmail(String.valueOf(email).trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + email));
    }

    public static class GradeRequest {
        private Double grade;
        private String feedback;

        public Double getGrade() { return grade; }
        public void setGrade(Double grade) { this.grade = grade; }
        public String getFeedback() { return feedback; }
        public void setFeedback(String feedback) { this.feedback = feedback; }
    }
}
