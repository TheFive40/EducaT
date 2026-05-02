package com.github.net.educat.controller;

import com.github.net.educat.application.CourseUnitService;
import com.github.net.educat.dto.request.CourseUnitRequest;
import com.github.net.educat.dto.response.CourseUnitResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/course-units")
@RequiredArgsConstructor
public class CourseUnitController {
    private final CourseUnitService courseUnitService;

    @GetMapping
    public ResponseEntity<List<CourseUnitResponse>> findAll() {
        return ResponseEntity.ok(courseUnitService.findAll());
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<CourseUnitResponse>> findByCourseId(@PathVariable Integer courseId) {
        return ResponseEntity.ok(courseUnitService.findByCourseId(courseId));
    }

    @GetMapping("/{id}")
    public ResponseEntity<CourseUnitResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(courseUnitService.findById(id));
    }

    @PostMapping
    public ResponseEntity<CourseUnitResponse> save(@Valid @RequestBody CourseUnitRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(courseUnitService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CourseUnitResponse> update(@PathVariable Integer id, @Valid @RequestBody CourseUnitRequest request) {
        return ResponseEntity.ok(courseUnitService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        courseUnitService.delete(id);
        return ResponseEntity.noContent().build();
    }
}