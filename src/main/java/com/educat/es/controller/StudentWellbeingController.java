package com.educat.es.controller;

import com.educat.es.dto.request.StudentWellbeingRequest;
import com.educat.es.dto.response.StudentWellbeingResponse;
import com.educat.es.application.StudentWellbeingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/student-wellbeing")
@RequiredArgsConstructor
public class StudentWellbeingController {
    private final StudentWellbeingService wellbeingService;

    @GetMapping
    public ResponseEntity<List<StudentWellbeingResponse>> findAll() {
        return ResponseEntity.ok(wellbeingService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<StudentWellbeingResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(wellbeingService.findById(id));
    }
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<StudentWellbeingResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(wellbeingService.findByStudentId(studentId));
    }
    @PostMapping
    public ResponseEntity<StudentWellbeingResponse> save(@Valid @RequestBody StudentWellbeingRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wellbeingService.save(request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        wellbeingService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
