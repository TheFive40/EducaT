package com.github.net.educat.controller;

import com.github.net.educat.dto.request.StudentRequest;
import com.github.net.educat.dto.response.StudentResponse;
import com.github.net.educat.application.StudentService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/students")
@RequiredArgsConstructor
public class StudentController {
    private final StudentService studentService;

    @GetMapping
    public ResponseEntity<List<StudentResponse>> findAll() {
        return ResponseEntity.ok(studentService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<StudentResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(studentService.findById(id));
    }
    @PostMapping
    public ResponseEntity<StudentResponse> save(@Valid @RequestBody StudentRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(studentService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<StudentResponse> update(@PathVariable Integer id, @Valid @RequestBody StudentRequest request) {
        return ResponseEntity.ok(studentService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        studentService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
