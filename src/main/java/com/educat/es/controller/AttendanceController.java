package com.educat.es.controller;

import com.educat.es.dto.request.AttendanceRequest;
import com.educat.es.dto.response.AttendanceResponse;
import com.educat.es.application.AttendanceService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/attendance")
@RequiredArgsConstructor
public class AttendanceController {
    private final AttendanceService attendanceService;

    @GetMapping
    public ResponseEntity<List<AttendanceResponse>> findAll() {
        return ResponseEntity.ok(attendanceService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<AttendanceResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(attendanceService.findById(id));
    }
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<AttendanceResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(attendanceService.findByStudentId(studentId));
    }
    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<AttendanceResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(attendanceService.findByCourseId(courseId));
    }
    @PostMapping
    public ResponseEntity<AttendanceResponse> save(@Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(attendanceService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<AttendanceResponse> update(@PathVariable Integer id, @Valid @RequestBody AttendanceRequest request) {
        return ResponseEntity.ok(attendanceService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        attendanceService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
