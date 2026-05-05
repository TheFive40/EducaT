package com.github.net.educat.application;

import com.github.net.educat.dto.request.PsychologyAppointmentRequest;
import com.github.net.educat.dto.response.PsychologyAppointmentResponse;

import java.util.List;
import java.util.Map;

public interface PsychologyAppointmentService {
    PsychologyAppointmentResponse create(Integer studentId, PsychologyAppointmentRequest request);
    List<PsychologyAppointmentResponse> findByStudent(Integer studentId);
    List<PsychologyAppointmentResponse> findAllScheduled();
    List<PsychologyAppointmentResponse> findByProfessional(String professionalName);
    PsychologyAppointmentResponse updateStatus(Integer id, String status, String resolutionComment);
    void delete(Integer id);
    Map<String, Object> getAvailabilityConfig();
    void saveAvailabilityConfig(Map<String, Object> config);
    Map<String, Object> getAvailabilityFreeSlots(String professionalName);
}
