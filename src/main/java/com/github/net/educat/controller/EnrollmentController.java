package com.github.net.educat.controller;

import com.github.net.educat.dto.request.EnrollmentRequest;
import com.github.net.educat.dto.response.EnrollmentResponse;
import com.github.net.educat.application.EnrollmentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/enrollments")
@RequiredArgsConstructor
public class EnrollmentController {
    private final EnrollmentService enrollmentService;

    @GetMapping
    public ResponseEntity<List<EnrollmentResponse>> findAll() {
        return ResponseEntity.ok(enrollmentService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<EnrollmentResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(enrollmentService.findById(id));
    }
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<EnrollmentResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(enrollmentService.findByStudentId(studentId));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<EnrollmentResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(enrollmentService.findByCourseId(courseId));
    }
    @PostMapping
    public ResponseEntity<EnrollmentResponse> save(@Valid @RequestBody EnrollmentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(enrollmentService.save(request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        enrollmentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
