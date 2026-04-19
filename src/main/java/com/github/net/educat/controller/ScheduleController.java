package com.github.net.educat.controller;

import com.github.net.educat.dto.request.ScheduleRequest;
import com.github.net.educat.dto.response.ScheduleResponse;
import com.github.net.educat.application.ScheduleService;
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
    @GetMapping("/{id:\\d+}")
    public ResponseEntity<ScheduleResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(scheduleService.findById(id));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ScheduleResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(scheduleService.findByCourseId(courseId));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<ScheduleResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(scheduleService.findByStudentId(studentId));
    }

    @GetMapping("/teacher/{teacherId}")
    public ResponseEntity<List<ScheduleResponse>> findByTeacher(@PathVariable Integer teacherId) {
        return ResponseEntity.ok(scheduleService.findByTeacherId(teacherId));
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
