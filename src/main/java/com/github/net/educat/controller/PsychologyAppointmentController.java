package com.github.net.educat.controller;

import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.application.PsychologyAppointmentService;
import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.PsychologyAppointmentRequest;
import com.github.net.educat.dto.response.PsychologyAppointmentResponse;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class PsychologyAppointmentController {

    private static final String MANAGE_APPOINTMENTS = "bienestar.psicologia.gestionar-citas";

    private final PsychologyAppointmentService psychologyAppointmentService;
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final AccessControlService accessControlService;

    // Student endpoints
    @GetMapping("/api/student/psychology/appointments")
    public ResponseEntity<List<PsychologyAppointmentResponse>> findMyAppointments(Principal principal) {
        User user = resolveUser(principal);
        Integer studentId = getStudentId(user);
        return ResponseEntity.ok(psychologyAppointmentService.findByStudent(studentId));
    }

    @PostMapping("/api/student/psychology/appointments")
    public ResponseEntity<PsychologyAppointmentResponse> createAppointment(
            @Valid @RequestBody PsychologyAppointmentRequest request,
            Principal principal
    ) {
        User user = resolveUser(principal);
        Integer studentId = getStudentId(user);
        return ResponseEntity.status(HttpStatus.CREATED).body(psychologyAppointmentService.create(studentId, request));
    }

    @DeleteMapping("/api/student/psychology/appointments/{id}")
    public ResponseEntity<Void> cancelMyAppointment(@PathVariable Integer id, Principal principal) {
        User user = resolveUser(principal);
        Integer studentId = getStudentId(user);
        PsychologyAppointmentResponse existing = psychologyAppointmentService.findByStudent(studentId).stream()
                .filter(a -> a.getId().equals(id))
                .findFirst()
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.NOT_FOUND, "Cita no encontrada"));
        psychologyAppointmentService.updateStatus(id, "CANCELLED", "Cancelada por el estudiante.");
        return ResponseEntity.noContent().build();
    }

    // Teacher / Admin endpoints
    @GetMapping("/api/teacher/psychology/appointments")
    public ResponseEntity<List<PsychologyAppointmentResponse>> findAllAppointments(Principal principal) {
        validateManagePermission(principal);
        return ResponseEntity.ok(psychologyAppointmentService.findAllScheduled());
    }

    @GetMapping("/api/teacher/psychology/appointments/professional")
    public ResponseEntity<List<PsychologyAppointmentResponse>> findByProfessional(
            @RequestParam String professionalName
    ) {
        return ResponseEntity.ok(psychologyAppointmentService.findByProfessional(professionalName));
    }

    @PatchMapping("/api/teacher/psychology/appointments/{id}/status")
    public ResponseEntity<PsychologyAppointmentResponse> updateStatus(
            @PathVariable Integer id,
            @RequestBody Map<String, String> body,
            Principal principal
    ) {
        validateManagePermission(principal);
        String status = body.get("status");
        String comment = body.get("resolutionComment");
        return ResponseEntity.ok(psychologyAppointmentService.updateStatus(id, status, comment));
    }

    @DeleteMapping("/api/teacher/psychology/appointments/{id}")
    public ResponseEntity<Void> deleteAppointment(@PathVariable Integer id, Principal principal) {
        validateManagePermission(principal);
        psychologyAppointmentService.delete(id);
        return ResponseEntity.noContent().build();
    }

    // Availability config
    @GetMapping("/api/psychology/availability")
    public ResponseEntity<Map<String, Object>> getAvailability() {
        return ResponseEntity.ok(psychologyAppointmentService.getAvailabilityConfig());
    }

    @GetMapping("/api/psychology/availability/free")
    public ResponseEntity<Map<String, Object>> getAvailabilityFree(@RequestParam String professionalName) {
        return ResponseEntity.ok(psychologyAppointmentService.getAvailabilityFreeSlots(professionalName));
    }

    @PutMapping("/api/teacher/psychology/availability")
    public ResponseEntity<Void> saveAvailability(@RequestBody Map<String, Object> config, Principal principal) {
        validateManagePermission(principal);
        psychologyAppointmentService.saveAvailabilityConfig(config);
        return ResponseEntity.ok().build();
    }

    private User resolveUser(Principal principal) {
        String email = principal != null ? principal.getName() : "";
        return userRepository.findByEmail(String.valueOf(email).trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario no encontrado"));
    }

    private Integer getStudentId(User user) {
        Student student = studentRepository.findByUserId(user.getId()).orElse(null);
        if (student != null) return student.getId();
        throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "El usuario no es estudiante");
    }

    private void validateManagePermission(Principal principal) {
        User user = resolveUser(principal);
        Set<String> granted = Set.copyOf(accessControlService.getEffectiveAccess(user).getPermissions());
        boolean isAdmin = isAdmin(user) || granted.contains("portal.admin");
        if (isAdmin) return;
        if (granted.contains(MANAGE_APPOINTMENTS)) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para gestionar citas psicologicas");
    }

    private boolean isAdmin(User user) {
        String roleName = user != null && user.getRole() != null ? String.valueOf(user.getRole().getName()) : "";
        String normalized = roleName.trim().toUpperCase(Locale.ROOT);
        return "ADMIN".equals(normalized) || "ADMINISTRADOR".equals(normalized);
    }
}
