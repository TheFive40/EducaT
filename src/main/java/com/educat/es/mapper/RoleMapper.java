package com.educat.es.mapper;

import com.educat.es.domain.Role;
import com.educat.es.dto.request.RoleRequest;
import com.educat.es.dto.response.RoleResponse;
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
