package com.github.net.educat.controller;

import com.github.net.educat.application.AcademicGradeService;
import com.github.net.educat.dto.request.AcademicGradeRequest;
import com.github.net.educat.dto.response.AcademicGradeResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/academic-grades")
@RequiredArgsConstructor
public class AcademicGradeController {
    private final AcademicGradeService academicGradeService;

    @GetMapping
    public ResponseEntity<List<AcademicGradeResponse>> findAll() {
        return ResponseEntity.ok(academicGradeService.findAll());
    }

    @GetMapping("/level/{levelId}")
    public ResponseEntity<List<AcademicGradeResponse>> findByLevelId(@PathVariable Integer levelId) {
        return ResponseEntity.ok(academicGradeService.findByLevelId(levelId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicGradeResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(academicGradeService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AcademicGradeResponse> save(@Valid @RequestBody AcademicGradeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicGradeService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademicGradeResponse> update(@PathVariable Integer id, @Valid @RequestBody AcademicGradeRequest request) {
        return ResponseEntity.ok(academicGradeService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        academicGradeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}