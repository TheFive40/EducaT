package com.optical.net.educat.mapper;

import com.optical.net.educat.domain.Role;
import com.optical.net.educat.dto.request.RoleRequest;
import com.optical.net.educat.dto.response.RoleResponse;
import org.springframework.stereotype.Component;

@Component
public class RoleMapper {
    public RoleResponse toResponse(Role role) {
        return RoleResponse.builder()
                .id(role.getId())
                .name(role.getName())
                .build();
    }
    public Role toEntity(RoleRequest request) {
        return Role.builder()
                .name(request.getName())
                .build();
    }
}
