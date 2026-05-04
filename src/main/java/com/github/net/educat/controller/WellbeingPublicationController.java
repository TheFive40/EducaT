package com.github.net.educat.controller;

import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.application.WellbeingPublicationService;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.WellbeingPublicationRequest;
import com.github.net.educat.dto.response.StudentWellbeingContentResponse;
import com.github.net.educat.dto.response.WellbeingPublicationResponse;
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
import java.util.Set;

@RestController
@RequiredArgsConstructor
public class WellbeingPublicationController {
    private static final String PUBLISH_WITHOUT_REQUEST = "bienestar.publicar-sin-solicitud";
    private static final String REVIEW_PUBLICATIONS = "bienestar.revisar-solicitudes-publicacion";

    private final WellbeingPublicationService wellbeingPublicationService;
    private final AccessControlService accessControlService;
    private final UserRepository userRepository;

    @GetMapping("/api/student/wellbeing/content")
    public ResponseEntity<StudentWellbeingContentResponse> getStudentContent() {
        return ResponseEntity.ok(wellbeingPublicationService.getStudentContent());
    }

    @GetMapping("/api/admin/wellbeing/publications")
    public ResponseEntity<List<WellbeingPublicationResponse>> findAllPublicationsAdmin() {
        return ResponseEntity.ok(wellbeingPublicationService.findAllPublications());
    }

    @GetMapping("/api/wellbeing/publications")
    public ResponseEntity<List<WellbeingPublicationResponse>> findAllPublications() {
        return ResponseEntity.ok(wellbeingPublicationService.findAllPublications());
    }

    @GetMapping("/api/teacher/wellbeing/publications/pending")
    public ResponseEntity<List<WellbeingPublicationResponse>> findPendingPublications(Principal principal) {
        validatePermission(principal, REVIEW_PUBLICATIONS);
        return ResponseEntity.ok(wellbeingPublicationService.findPendingPublications());
    }

    @PostMapping("/api/admin/wellbeing/publications")
    public ResponseEntity<WellbeingPublicationResponse> createPublicationAdmin(@Valid @RequestBody WellbeingPublicationRequest request, Principal principal) {
        return createPublicationInternal(request, principal);
    }

    @PostMapping("/api/wellbeing/publications")
    public ResponseEntity<WellbeingPublicationResponse> createPublication(@Valid @RequestBody WellbeingPublicationRequest request, Principal principal) {
        return createPublicationInternal(request, principal);
    }

    private ResponseEntity<WellbeingPublicationResponse> createPublicationInternal(WellbeingPublicationRequest request, Principal principal) {
        boolean publishDirectly = canPublishWithoutRequest(principal);
        if (!publishDirectly) {
            User user = resolveUser(principal);
            if (request.getRequestedBy() == null || request.getRequestedBy().isBlank()) {
                request.setRequestedBy(user.getName());
            }
        }
        return ResponseEntity.status(HttpStatus.CREATED).body(wellbeingPublicationService.createPublication(request, publishDirectly));
    }

    @PutMapping("/api/admin/wellbeing/publications/{id}")
    public ResponseEntity<WellbeingPublicationResponse> updatePublicationAdmin(@PathVariable String id, @Valid @RequestBody WellbeingPublicationRequest request) {
        return ResponseEntity.ok(wellbeingPublicationService.updatePublication(id, request));
    }

    @PutMapping("/api/wellbeing/publications/{id}")
    public ResponseEntity<WellbeingPublicationResponse> updatePublication(@PathVariable String id, @Valid @RequestBody WellbeingPublicationRequest request) {
        return ResponseEntity.ok(wellbeingPublicationService.updatePublication(id, request));
    }

    @DeleteMapping("/api/admin/wellbeing/publications/{id}")
    public ResponseEntity<Void> deletePublicationAdmin(@PathVariable String id) {
        wellbeingPublicationService.deletePublication(id);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping("/api/wellbeing/publications/{id}")
    public ResponseEntity<Void> deletePublication(@PathVariable String id) {
        wellbeingPublicationService.deletePublication(id);
        return ResponseEntity.noContent().build();
    }

    @PatchMapping("/api/teacher/wellbeing/publications/{id}/status")
    public ResponseEntity<WellbeingPublicationResponse> reviewPublication(
            @PathVariable String id,
            @RequestBody java.util.Map<String, String> body,
            Principal principal
    ) {
        validatePermission(principal, REVIEW_PUBLICATIONS);
        String status = body.get("status");
        String resolutionComment = body.get("resolutionComment");
        User user = resolveUser(principal);
        return ResponseEntity.ok(wellbeingPublicationService.reviewPublication(id, status, user.getName(), resolutionComment));
    }

    private boolean canPublishWithoutRequest(Principal principal) {
        User user = resolveUser(principal);
        Set<String> granted = Set.copyOf(accessControlService.getEffectiveAccess(user).getPermissions());
        return isAdmin(user) || granted.contains(PUBLISH_WITHOUT_REQUEST);
    }

    private void validatePermission(Principal principal, String permission) {
        User user = resolveUser(principal);
        Set<String> granted = Set.copyOf(accessControlService.getEffectiveAccess(user).getPermissions());
        boolean isAdmin = isAdmin(user) || granted.contains("portal.admin");
        if (isAdmin) return;
        if (granted.contains(permission)) return;
        throw new ResponseStatusException(HttpStatus.FORBIDDEN, "No tienes permisos para realizar esta accion");
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
