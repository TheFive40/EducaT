package com.optical.net.educat.controller;

import com.optical.net.educat.dto.request.TeacherRequest;
import com.optical.net.educat.dto.response.TeacherResponse;
import com.optical.net.educat.application.TeacherService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/teachers")
@RequiredArgsConstructor
public class TeacherController {
    private final TeacherService teacherService;

    @GetMapping
    public ResponseEntity<List<TeacherResponse>> findAll() {
        return ResponseEntity.ok(teacherService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<TeacherResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(teacherService.findById(id));
    }
    @PostMapping
    public ResponseEntity<TeacherResponse> save(@Valid @RequestBody TeacherRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(teacherService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<TeacherResponse> update(@PathVariable Integer id, @Valid @RequestBody TeacherRequest request) {
        return ResponseEntity.ok(teacherService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        teacherService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
