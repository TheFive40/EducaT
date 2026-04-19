package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.WellbeingRequestService;
import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.WellbeingRequest;
import com.github.net.educat.dto.request.WellbeingRequestCreateRequest;
import com.github.net.educat.dto.request.WellbeingRequestStatusRequest;
import com.github.net.educat.dto.response.WellbeingRequestResponse;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.WellbeingRequestRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class WellbeingRequestServiceImpl implements WellbeingRequestService {
    private static final Set<String> VALID_MODULE_TYPES = Set.of(
            "PSYCHOLOGY", "SPORTS", "ART", "ORIENTATION", "MEDICAL", "SCHOLARSHIPS"
    );
    private static final Set<String> VALID_STATUSES = Set.of("PENDING", "APPROVED", "REJECTED", "CANCELLED");
    private static final Set<String> VALID_TITLES = Set.of(
            "PSYCH_APPOINTMENT",
            "MEDICAL_APPOINTMENT",
            "SPORT_CALL_REGISTRATION",
            "WORKSHOP_REGISTRATION",
            "SCHOLARSHIP_APPLICATION",
            "POST_REACTION",
            "POST_COMMENT"
    );

    private final WellbeingRequestRepository wellbeingRequestRepository;
    private final StudentRepository studentRepository;
    private final StudentMapper studentMapper;
    private final ObjectMapper objectMapper;

    @Override
    public WellbeingRequestResponse create(WellbeingRequestCreateRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));

        WellbeingRequest wellbeingRequest = WellbeingRequest.builder()
                .student(student)
                .moduleType(normalizeModuleType(request.getModuleType()))
                .title(normalizeTitle(request.getTitle()))
                .message(request.getMessage())
                .payloadJson(writeMap(request.getPayload()))
                .requestedAt(LocalDateTime.now())
                .scheduledAt(request.getScheduledAt())
                .status("PENDING")
                .build();

        return toResponse(wellbeingRequestRepository.save(wellbeingRequest));
    }

    @Override
    @Transactional(readOnly = true)
    public WellbeingRequestResponse findById(Integer id) {
        return wellbeingRequestRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Wellbeing request not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<WellbeingRequestResponse> findByFilters(Integer studentId, String moduleType, String status, Pageable pageable) {
        Specification<WellbeingRequest> spec = (root, query, cb) -> cb.conjunction();

        if (studentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("student").get("id"), studentId));
        }
        if (moduleType != null && !moduleType.isBlank()) {
            String normalized = normalizeModuleType(moduleType);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("moduleType"), normalized));
        }
        if (status != null && !status.isBlank()) {
            String normalized = normalizeStatus(status);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("status"), normalized));
        }

        return wellbeingRequestRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public WellbeingRequestResponse updateStatus(Integer id, WellbeingRequestStatusRequest request) {
        WellbeingRequest wellbeingRequest = wellbeingRequestRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Wellbeing request not found: " + id));

        wellbeingRequest.setStatus(normalizeStatus(request.getStatus()));
        wellbeingRequest.setResolutionComment(normalizeResolutionComment(request.getResolutionComment()));

        return toResponse(wellbeingRequestRepository.save(wellbeingRequest));
    }

    @Override
    public void delete(Integer id) {
        if (!wellbeingRequestRepository.existsById(id)) {
            throw new EntityNotFoundException("Wellbeing request not found: " + id);
        }
        wellbeingRequestRepository.deleteById(id);
    }

    private String normalizeModuleType(String moduleType) {
        String normalized = moduleType == null ? "" : moduleType.trim().toUpperCase(Locale.ROOT);
        if (!VALID_MODULE_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid wellbeing module type: " + moduleType);
        }
        return normalized;
    }

    private String normalizeStatus(String status) {
        String normalized = status == null ? "" : status.trim().toUpperCase(Locale.ROOT);
        if (!VALID_STATUSES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid wellbeing status: " + status);
        }
        return normalized;
    }

    private String normalizeTitle(String title) {
        String normalized = title == null ? "" : title.trim().toUpperCase(Locale.ROOT);
        if ("CITA PSICOLÓGICA".equals(normalized) || "CITA PSICOLOGICA".equals(normalized)) return "PSYCH_APPOINTMENT";
        if ("SOLICITUD DE ATENCIÓN MÉDICA".equals(normalized) || "SOLICITUD DE ATENCION MEDICA".equals(normalized)) return "MEDICAL_APPOINTMENT";
        if ("INSCRIPCIÓN DEPORTIVA".equals(normalized) || "INSCRIPCION DEPORTIVA".equals(normalized)) return "SPORT_CALL_REGISTRATION";
        if ("TALLER DE ORIENTACIÓN".equals(normalized) || "TALLER DE ORIENTACION".equals(normalized)) return "WORKSHOP_REGISTRATION";
        if ("POSTULACIÓN A BECA".equals(normalized) || "POSTULACION A BECA".equals(normalized)) return "SCHOLARSHIP_APPLICATION";
        if (!VALID_TITLES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid wellbeing title: " + title);
        }
        return normalized;
    }

    private String normalizeResolutionComment(String resolutionComment) {
        if (resolutionComment == null) return null;
        String trimmed = resolutionComment.trim();
        return trimmed.isEmpty() ? null : trimmed;
    }

    private WellbeingRequestResponse toResponse(WellbeingRequest wellbeingRequest) {
        return WellbeingRequestResponse.builder()
                .id(wellbeingRequest.getId())
                .student(wellbeingRequest.getStudent() != null ? studentMapper.toResponse(wellbeingRequest.getStudent()) : null)
                .moduleType(wellbeingRequest.getModuleType())
                .title(wellbeingRequest.getTitle())
                .message(wellbeingRequest.getMessage())
                .payload(readMap(wellbeingRequest.getPayloadJson()))
                .requestedAt(wellbeingRequest.getRequestedAt())
                .scheduledAt(wellbeingRequest.getScheduledAt())
                .status(wellbeingRequest.getStatus())
                .resolutionComment(wellbeingRequest.getResolutionComment())
                .build();
    }

    private String writeMap(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot serialize wellbeing payload");
        }
    }

    private Map<String, Object> readMap(String rawJson) {
        try {
            if (rawJson == null || rawJson.isBlank()) return Map.of();
            return objectMapper.readValue(rawJson, new TypeReference<>() {});
        } catch (Exception ex) {
            return Collections.emptyMap();
        }
    }
}
