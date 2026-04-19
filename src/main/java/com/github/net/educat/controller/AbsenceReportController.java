package com.github.net.educat.controller;

import com.github.net.educat.application.AbsenceReportService;
import com.github.net.educat.dto.request.AbsenceReportRequest;
import com.github.net.educat.dto.request.AbsenceReportStatusRequest;
import com.github.net.educat.dto.response.AbsenceReportResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping({"/api/student/absence-reports", "/api/teacher/absence-reports"})
@RequiredArgsConstructor
public class AbsenceReportController {
    private final AbsenceReportService absenceReportService;

    @GetMapping
    public ResponseEntity<Page<AbsenceReportResponse>> findByFilters(
            @RequestParam(required = false) Integer studentId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(absenceReportService.findByFilters(studentId, courseId, status, pageable));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Page<AbsenceReportResponse>> findByStudent(
            @PathVariable Integer studentId,
            @RequestParam(required = false) Integer courseId,
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(absenceReportService.findByFilters(studentId, courseId, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<AbsenceReportResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(absenceReportService.findById(id));
    }

    @PostMapping
    public ResponseEntity<AbsenceReportResponse> create(@Valid @RequestBody AbsenceReportRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(absenceReportService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<AbsenceReportResponse> updateStatus(@PathVariable Integer id, @Valid @RequestBody AbsenceReportStatusRequest request) {
        return ResponseEntity.ok(absenceReportService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        absenceReportService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
