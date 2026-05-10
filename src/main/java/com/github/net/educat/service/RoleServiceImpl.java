package com.github.net.educat.service;

import com.github.net.educat.application.AuditLogService;
import com.github.net.educat.domain.Role;
import com.github.net.educat.dto.request.RoleRequest;
import com.github.net.educat.dto.response.RoleResponse;
import com.github.net.educat.mapper.RoleMapper;
import com.github.net.educat.repository.RoleRepository;
import com.github.net.educat.application.RoleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;
    private final AuditLogService auditLogService;

    private String currentActorEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @Override @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream().map(roleMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public RoleResponse findById(Integer id) {
        return roleRepository.findById(id).map(roleMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + id));
    }
    @Override
    public RoleResponse save(RoleRequest request) {
        Role role = roleMapper.toEntity(request);
        RoleResponse response = roleMapper.toResponse(roleRepository.save(role));
        auditLogService.log(currentActorEmail(), "CREATE", "ROLE", String.valueOf(response.getId()),
                "Rol creado: " + response.getName());
        return response;
    }
    @Override
    public RoleResponse update(Integer id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + id));
        String oldName = role.getName();
        role.setName(request.getName());
        RoleResponse response = roleMapper.toResponse(roleRepository.save(role));
        auditLogService.log(currentActorEmail(), "UPDATE", "ROLE", String.valueOf(id),
                "Rol actualizado: " + oldName + " -> " + response.getName());
        return response;
    }
    @Override
    public void delete(Integer id) {
        if (!roleRepository.existsById(id)) throw new EntityNotFoundException("Role not found: " + id);
        Role role = roleRepository.findById(id).orElse(null);
        roleRepository.deleteById(id);
        auditLogService.log(currentActorEmail(), "DELETE", "ROLE", String.valueOf(id),
                "Rol eliminado: " + (role != null ? role.getName() : "unknown"));
    }
}
