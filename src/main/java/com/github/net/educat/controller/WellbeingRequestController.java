package com.github.net.educat.controller;

import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.application.WellbeingRequestService;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.WellbeingRequestCreateRequest;
import com.github.net.educat.dto.request.WellbeingRequestStatusRequest;
import com.github.net.educat.dto.response.WellbeingRequestResponse;
import com.github.net.educat.repository.UserRepository;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.server.ResponseStatusException;

import java.security.Principal;
import java.util.Locale;
import java.util.Set;

@RestController
@RequestMapping({"/api/student/wellbeing-requests", "/api/teacher/wellbeing-requests"})
@RequiredArgsConstructor
public class WellbeingRequestController {
    private static final String APPROVE_PERMISSION = "bienestar.aprobar-publicacion";
    private static final String REJECT_PERMISSION = "bienestar.rechazar-publicacion";

    private final WellbeingRequestService wellbeingRequestService;
    private final AccessControlService accessControlService;
    private final UserRepository userRepository;

    @GetMapping
    public ResponseEntity<Page<WellbeingRequestResponse>> findByFilters(
            @RequestParam(required = false) Integer studentId,
            @RequestParam(required = false) String moduleType,
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(wellbeingRequestService.findByFilters(studentId, moduleType, status, pageable));
    }

    @GetMapping("/student/{studentId}")
    public ResponseEntity<Page<WellbeingRequestResponse>> findByStudent(
            @PathVariable Integer studentId,
            @RequestParam(required = false) String moduleType,
            @RequestParam(required = false) String status,
            Pageable pageable
    ) {
        return ResponseEntity.ok(wellbeingRequestService.findByFilters(studentId, moduleType, status, pageable));
    }

    @GetMapping("/{id}")
    public ResponseEntity<WellbeingRequestResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(wellbeingRequestService.findById(id));
    }

    @PostMapping
    public ResponseEntity<WellbeingRequestResponse> create(@Valid @RequestBody WellbeingRequestCreateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wellbeingRequestService.create(request));
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<WellbeingRequestResponse> updateStatus(
            @PathVariable Integer id,
            @Valid @RequestBody WellbeingRequestStatusRequest request,
            Principal principal
    ) {
        validateStatusPermission(request.getStatus(), principal);
        return ResponseEntity.ok(wellbeingRequestService.updateStatus(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        wellbeingRequestService.delete(id);
        return ResponseEntity.noContent().build();
    }

    private void validateStatusPermission(String status, Principal principal) {
        String normalized = String.valueOf(status == null ? "" : status).trim().toUpperCase(Locale.ROOT);
        User user = resolveUser(principal);
        Set<String> granted = Set.copyOf(accessControlService.getEffectiveAccess(user).getPermissions());
        boolean isAdmin = isAdmin(user) || granted.contains("portal.admin");
        if (isAdmin) return;
        if ("APPROVED".equals(normalized) && granted.contains(APPROVE_PERMISSION)) return;
        if (("REJECTED".equals(normalized) || "CANCELLED".equals(normalized)) && granted.contains(REJECT_PERMISSION)) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para actualizar este estado");
    }

    private User resolveUser(Principal principal) {
        String email = principal != null ? principal.getName() : "";
        return userRepository.findByEmail(String.valueOf(email).trim().toLowerCase(Locale.ROOT))
                .orElseThrow(() -> new ResponseStatusException(HttpStatus.UNAUTHORIZED, "Usuario autenticado no encontrado"));
    }

    private boolean isAdmin(User user) {
        String roleName = user != null && user.getRole() != null ? String.valueOf(user.getRole().getName()) : "";
        String normalized = roleName.trim().toUpperCase(Locale.ROOT);
        return "ADMIN".equals(normalized) || "ADMINISTRADOR".equals(normalized);
    }
}
