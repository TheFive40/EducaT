package com.github.net.educat.controller;

import com.github.net.educat.dto.request.CourseRequest;
import com.github.net.educat.dto.request.CourseJoinByCodeRequest;
import com.github.net.educat.dto.response.CourseJoinByCodeResponse;
import com.github.net.educat.dto.response.CourseResponse;
import com.github.net.educat.application.CourseService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/courses")
@RequiredArgsConstructor
public class CourseController {
    private final CourseService courseService;

    @GetMapping
    public ResponseEntity<List<CourseResponse>> findAll() {
        return ResponseEntity.ok(courseService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<CourseResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(courseService.findById(id));
    }
    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<CourseResponse>> findByTeacher(@PathVariable Integer teacherId) {
        return ResponseEntity.ok(courseService.findByTeacherId(teacherId));
    }
    @GetMapping("/available/teacher")
    public ResponseEntity<List<CourseResponse>> findAvailableForTeacher() {
        return ResponseEntity.ok(courseService.findAvailableForTeacher());
    }
    @PostMapping
    public ResponseEntity<CourseResponse> save(@Valid @RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseService.save(request));
    }
    @PostMapping("/join-by-code")
    public ResponseEntity<CourseJoinByCodeResponse> joinByCode(@Valid @RequestBody CourseJoinByCodeRequest request) {
        return ResponseEntity.ok(courseService.joinByCode(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<CourseResponse> update(@PathVariable Integer id, @Valid @RequestBody CourseRequest request) {
        return ResponseEntity.ok(courseService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        courseService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
