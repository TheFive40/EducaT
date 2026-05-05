package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.PsychologyAppointmentService;
import com.github.net.educat.domain.InstitutionSettings;
import com.github.net.educat.domain.PsychologyAppointment;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.PsychologyAppointmentRequest;
import com.github.net.educat.dto.response.PsychologyAppointmentResponse;
import com.github.net.educat.repository.InstitutionSettingsRepository;
import com.github.net.educat.repository.PsychologyAppointmentRepository;
import com.github.net.educat.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.Collections;
import java.util.List;
import java.util.Map;

@Service
@RequiredArgsConstructor
@Transactional
public class PsychologyAppointmentServiceImpl implements PsychologyAppointmentService {

    private final PsychologyAppointmentRepository appointmentRepository;
    private final InstitutionSettingsRepository institutionSettingsRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;

    @Override
    public PsychologyAppointmentResponse create(Integer studentId, PsychologyAppointmentRequest request) {
        LocalDate date = LocalDate.parse(request.getAppointmentDate(), DateTimeFormatter.ISO_LOCAL_DATE);
        String slot = request.getSlot().trim();
        String prof = request.getProfessionalName().trim();

        boolean alreadyBooked = appointmentRepository.existsByProfessionalNameAndAppointmentDateAndSlotAndStatus(
                prof, date, slot, "SCHEDULED"
        );
        if (alreadyBooked) {
            throw new IllegalArgumentException("Este horario ya esta reservado.");
        }

        PsychologyAppointment appointment = PsychologyAppointment.builder()
                .studentId(studentId)
                .professionalName(prof)
                .appointmentDate(date)
                .slot(slot)
                .reason(request.getReason())
                .status("SCHEDULED")
                .createdAt(LocalDateTime.now())
                .build();

        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    @Transactional(readOnly = true)
    public List<PsychologyAppointmentResponse> findByStudent(Integer studentId) {
        return appointmentRepository.findByStudentIdOrderByAppointmentDateDesc(studentId)
                .stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PsychologyAppointmentResponse> findAllScheduled() {
        return appointmentRepository.findAll().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<PsychologyAppointmentResponse> findByProfessional(String professionalName) {
        return appointmentRepository.findByProfessionalNameAndStatusOrderByAppointmentDateAsc(professionalName, "SCHEDULED")
                .stream().map(this::toResponse).toList();
    }

    @Override
    public PsychologyAppointmentResponse updateStatus(Integer id, String status, String resolutionComment) {
        PsychologyAppointment appointment = appointmentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Cita no encontrada: " + id));
        String normalized = String.valueOf(status == null ? "" : status).trim().toUpperCase();
        if (!List.of("SCHEDULED", "COMPLETED", "CANCELLED").contains(normalized)) {
            throw new IllegalArgumentException("Estado invalido: " + status);
        }
        appointment.setStatus(normalized);
        if (resolutionComment != null && !resolutionComment.isBlank()) {
            appointment.setResolutionComment(resolutionComment);
        }
        return toResponse(appointmentRepository.save(appointment));
    }

    @Override
    public void delete(Integer id) {
        if (!appointmentRepository.existsById(id)) {
            throw new EntityNotFoundException("Cita no encontrada: " + id);
        }
        appointmentRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Map<String, Object> getAvailabilityConfig() {
        List<InstitutionSettings> settings = institutionSettingsRepository.findAll();
        if (settings.isEmpty()) return Collections.emptyMap();
        String raw = settings.get(0).getPsychologyAvailabilityJson();
        if (raw == null || raw.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(raw, new TypeReference<>() {});
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    @Override
    public void saveAvailabilityConfig(Map<String, Object> config) {
        List<InstitutionSettings> settings = institutionSettingsRepository.findAll();
        InstitutionSettings setting = settings.isEmpty()
                ? InstitutionSettings.builder().name("Default").build()
                : settings.get(0);
        try {
            setting.setPsychologyAvailabilityJson(objectMapper.writeValueAsString(config));
        } catch (Exception e) {
            setting.setPsychologyAvailabilityJson("{}");
        }
        institutionSettingsRepository.save(setting);
    }

    @Override
    @Transactional(readOnly = true)
    @SuppressWarnings("unchecked")
    public Map<String, Object> getAvailabilityFreeSlots(String professionalName) {
        Map<String, Object> cfg = getAvailabilityConfig();
        if (cfg == null || cfg.isEmpty()) return cfg;
        Map<String, Object> dates = (Map<String, Object>) cfg.get("dates");
        if (dates == null || !dates.containsKey(professionalName)) return cfg;

        List<Map<String, Object>> profDates = (List<Map<String, Object>>) dates.get(professionalName);
        if (profDates == null || profDates.isEmpty()) return cfg;

        List<PsychologyAppointment> booked = appointmentRepository.findByProfessionalNameAndStatusOrderByAppointmentDateAsc(professionalName, "SCHEDULED");

        List<Map<String, Object>> freeDates = profDates.stream().map(d -> {
            String dateStr = (String) d.get("date");
            List<String> slots = (List<String>) d.get("slots");
            if (slots == null || dateStr == null) return d;
            LocalDate date = LocalDate.parse(dateStr, DateTimeFormatter.ISO_LOCAL_DATE);
            List<String> bookedSlots = booked.stream()
                    .filter(a -> a.getAppointmentDate().equals(date))
                    .map(PsychologyAppointment::getSlot)
                    .toList();
            List<String> freeSlots = slots.stream()
                    .filter(s -> !bookedSlots.contains(s))
                    .toList();
            Map<String, Object> copy = new java.util.LinkedHashMap<>(d);
            copy.put("slots", freeSlots);
            return copy;
        }).toList();

        Map<String, Object> freeDatesMap = new java.util.LinkedHashMap<>(dates);
        freeDatesMap.put(professionalName, freeDates);
        Map<String, Object> result = new java.util.LinkedHashMap<>(cfg);
        result.put("dates", freeDatesMap);
        return result;
    }

    private PsychologyAppointmentResponse toResponse(PsychologyAppointment a) {
        String studentName = null;
        if (a.getStudentId() != null) {
            Student s = studentRepository.findById(a.getStudentId()).orElse(null);
            if (s != null && s.getUser() != null) {
                studentName = s.getUser().getName();
            }
        }
        return PsychologyAppointmentResponse.builder()
                .id(a.getId())
                .studentId(a.getStudentId())
                .studentName(studentName)
                .professionalName(a.getProfessionalName())
                .appointmentDate(a.getAppointmentDate() != null ? a.getAppointmentDate().toString() : null)
                .slot(a.getSlot())
                .reason(a.getReason())
                .status(a.getStatus())
                .createdAt(a.getCreatedAt())
                .resolutionComment(a.getResolutionComment())
                .build();
    }
}
