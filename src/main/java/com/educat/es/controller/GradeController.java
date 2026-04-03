package com.educat.es.controller;

import com.educat.es.dto.request.GradeRequest;
import com.educat.es.dto.response.GradeResponse;
import com.educat.es.application.GradeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/grades")
@RequiredArgsConstructor
public class GradeController {
    private final GradeService gradeService;

    @GetMapping
    public ResponseEntity<List<GradeResponse>> findAll() {
        return ResponseEntity.ok(gradeService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<GradeResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(gradeService.findById(id));
    }
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<GradeResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(gradeService.findByStudentId(studentId));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<GradeResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(gradeService.findByCourseId(courseId));
    }
    @PostMapping
    public ResponseEntity<GradeResponse> save(@Valid @RequestBody GradeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(gradeService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<GradeResponse> update(@PathVariable Integer id, @Valid @RequestBody GradeRequest request) {
        return ResponseEntity.ok(gradeService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        gradeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
