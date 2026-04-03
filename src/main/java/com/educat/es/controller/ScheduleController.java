package com.educat.es.controller;

import com.educat.es.dto.request.ScheduleRequest;
import com.educat.es.dto.response.ScheduleResponse;
import com.educat.es.application.ScheduleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/schedules")
@RequiredArgsConstructor
public class ScheduleController {
    private final ScheduleService scheduleService;

    @GetMapping
    public ResponseEntity<List<ScheduleResponse>> findAll() {
        return ResponseEntity.ok(scheduleService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ScheduleResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(scheduleService.findById(id));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ScheduleResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(scheduleService.findByCourseId(courseId));
    }
    @PostMapping
    public ResponseEntity<ScheduleResponse> save(@Valid @RequestBody ScheduleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(scheduleService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ScheduleResponse> update(@PathVariable Integer id, @Valid @RequestBody ScheduleRequest request) {
        return ResponseEntity.ok(scheduleService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        scheduleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
