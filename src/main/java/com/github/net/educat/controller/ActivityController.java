package com.github.net.educat.controller;

import com.github.net.educat.dto.request.ActivityRequest;
import com.github.net.educat.dto.response.ActivityResponse;
import com.github.net.educat.application.ActivityService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/activities")
@RequiredArgsConstructor
public class ActivityController {
    private final ActivityService activityService;

    @GetMapping
    public ResponseEntity<List<ActivityResponse>> findAll() {
        return ResponseEntity.ok(activityService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ActivityResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(activityService.findById(id));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ActivityResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(activityService.findByCourseId(courseId));
    }
    @PostMapping
    public ResponseEntity<ActivityResponse> save(@Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(activityService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ActivityResponse> update(@PathVariable Integer id, @Valid @RequestBody ActivityRequest request) {
        return ResponseEntity.ok(activityService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        activityService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
