package com.github.net.educat.controller;

import com.github.net.educat.application.AcademicLevelService;
import com.github.net.educat.dto.request.AcademicLevelRequest;
import com.github.net.educat.dto.response.AcademicLevelResponse;
import jakarta.persistence.EntityNotFoundException;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.dao.EmptyResultDataAccessException;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/academic-levels")
@RequiredArgsConstructor
public class AcademicLevelController {
    private final AcademicLevelService academicLevelService;

    @GetMapping
    public ResponseEntity<List<AcademicLevelResponse>> findAll() {
        return ResponseEntity.ok(academicLevelService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<AcademicLevelResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(academicLevelService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AcademicLevelResponse> save(@Valid @RequestBody AcademicLevelRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(academicLevelService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<AcademicLevelResponse> update(@PathVariable Integer id, @Valid @RequestBody AcademicLevelRequest request) {
        return ResponseEntity.ok(academicLevelService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        academicLevelService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @ExceptionHandler(EntityNotFoundException.class)
    public ResponseEntity<Map<String, String>> handleNotFound(EntityNotFoundException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", ex.getMessage()));
    }

    @ExceptionHandler(DataIntegrityViolationException.class)
    public ResponseEntity<Map<String, String>> handleConflict(DataIntegrityViolationException ex) {
        return ResponseEntity.status(HttpStatus.CONFLICT)
                .body(Map.of("error", "No se puede eliminar el nivel porque tiene grados, cursos u otros registros vinculados."));
    }

    @ExceptionHandler(EmptyResultDataAccessException.class)
    public ResponseEntity<Map<String, String>> handleEmptyResult(EmptyResultDataAccessException ex) {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
                .body(Map.of("error", "Nivel no encontrado."));
    }
}