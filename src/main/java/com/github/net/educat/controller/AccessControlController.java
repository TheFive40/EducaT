package com.github.net.educat.controller;

import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.PermissionListRequest;
import com.github.net.educat.dto.response.AccessConfigResponse;
import com.github.net.educat.dto.response.EffectiveAccessResponse;
import com.github.net.educat.dto.response.PortalAccessResponse;
import com.github.net.educat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.List;

@RestController
@RequiredArgsConstructor
public class AccessControlController {
    private final AccessControlService accessControlService;
    private final UserRepository userRepository;

    @GetMapping("/api/admin/access/config")
    public ResponseEntity<AccessConfigResponse> getConfig() {
        return ResponseEntity.ok(accessControlService.getAccessConfig());
    }

    @PutMapping("/api/admin/access/roles/{roleId}/permissions")
    public ResponseEntity<List<String>> saveRolePermissions(
            @PathVariable Integer roleId,
            @RequestBody PermissionListRequest request
    ) {
        return ResponseEntity.ok(accessControlService.saveRolePermissions(roleId, request.getPermissions()));
    }

    @PutMapping("/api/admin/access/users/{userId}/permissions")
    public ResponseEntity<List<String>> saveUserPermissions(
            @PathVariable Integer userId,
            @RequestBody PermissionListRequest request
    ) {
        return ResponseEntity.ok(accessControlService.saveUserPermissions(userId, request.getPermissions()));
    }

    @PutMapping("/api/admin/access/users/{userId}/portals")
    public ResponseEntity<PortalAccessResponse> saveUserPortalAccess(
            @PathVariable Integer userId,
            @RequestBody PortalAccessResponse request
    ) {
        return ResponseEntity.ok(accessControlService.saveUserPortalAccess(userId, request));
    }

    @GetMapping("/api/access/me")
    public ResponseEntity<EffectiveAccessResponse> getMyEffectiveAccess(Principal principal) {
        User user = resolveUser(principal);
        return ResponseEntity.ok(accessControlService.getEffectiveAccess(user));
    }

    private User resolveUser(Principal principal) {
        String email = principal != null ? principal.getName() : "";
        return userRepository.findByEmail(String.valueOf(email).trim().toLowerCase())
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + email));
    }
}

