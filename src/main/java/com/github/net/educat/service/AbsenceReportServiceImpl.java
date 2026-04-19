package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.AbsenceReportService;
import com.github.net.educat.domain.AbsenceReport;
import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.AbsenceReportRequest;
import com.github.net.educat.dto.request.AbsenceReportStatusRequest;
import com.github.net.educat.dto.response.AbsenceReportResponse;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.AbsenceReportRepository;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class AbsenceReportServiceImpl implements AbsenceReportService {
    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "APPROVED", "REJECTED");

    private final AbsenceReportRepository absenceReportRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;
    private final ObjectMapper objectMapper;

    @Override
    public AbsenceReportResponse create(AbsenceReportRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));

        AbsenceReport report = AbsenceReport.builder()
                .student(student)
                .course(course)
                .absenceDate(request.getAbsenceDate())
                .reason(request.getReason().trim())
                .description(request.getDescription())
                .attachmentsJson(writeList(request.getAttachments()))
                .status("PENDING")
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(absenceReportRepository.save(report));
    }

    @Override
    @Transactional(readOnly = true)
    public AbsenceReportResponse findById(Integer id) {
        return absenceReportRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Absence report not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<AbsenceReportResponse> findByFilters(Integer studentId, Integer courseId, String status, Pageable pageable) {
        Specification<AbsenceReport> spec = (root, query, cb) -> cb.conjunction();

        if (studentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("student").get("id"), studentId));
        }
        if (courseId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("course").get("id"), courseId));
        }
        if (status != null && !status.isBlank()) {
            String normalized = normalizeStatus(status);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), normalized));
        }

        return absenceReportRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public AbsenceReportResponse updateStatus(Integer id, AbsenceReportStatusRequest request) {
        AbsenceReport report = absenceReportRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Absence report not found: " + id));

        report.setStatus(normalizeStatus(request.getStatus()));
        report.setReviewComment(request.getReviewComment());
        report.setReviewerUserId(request.getReviewerUserId());
        report.setReviewedAt(LocalDateTime.now());

        return toResponse(absenceReportRepository.save(report));
    }

    @Override
    public void delete(Integer id) {
        if (!absenceReportRepository.existsById(id)) {
            throw new EntityNotFoundException("Absence report not found: " + id);
        }
        absenceReportRepository.deleteById(id);
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid absence status: " + status);
        }
        return normalized;
    }

    private AbsenceReportResponse toResponse(AbsenceReport report) {
        return AbsenceReportResponse.builder()
                .id(report.getId())
                .student(report.getStudent() != null ? studentMapper.toResponse(report.getStudent()) : null)
                .course(report.getCourse() != null ? courseMapper.toResponse(report.getCourse()) : null)
                .absenceDate(report.getAbsenceDate())
                .reason(report.getReason())
                .description(report.getDescription())
                .attachments(readList(report.getAttachmentsJson()))
                .status(report.getStatus())
                .createdAt(report.getCreatedAt())
                .reviewedAt(report.getReviewedAt())
                .reviewComment(report.getReviewComment())
                .reviewerUserId(report.getReviewerUserId())
                .build();
    }

    private String writeList(List<String> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? List.of() : values);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot serialize absence attachments");
        }
    }

    private List<String> readList(String rawJson) {
        try {
            if (rawJson == null || rawJson.isBlank()) return List.of();
            return objectMapper.readValue(rawJson, new TypeReference<>() {});
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
