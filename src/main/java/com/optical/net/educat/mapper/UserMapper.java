package com.optical.net.educat.mapper;

import com.optical.net.educat.domain.User;
import com.optical.net.educat.dto.request.UserRequest;
import com.optical.net.educat.dto.response.UserResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class UserMapper {
    private final RoleMapper roleMapper;

    public UserResponse toResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .name(user.getName())
                .email(user.getEmail())
                .role(user.getRole() != null ? roleMapper.toResponse(user.getRole()) : null)
                .status(user.getStatus())
                .createdAt(user.getCreatedAt())
                .build();
    }
    public User toEntity(UserRequest request) {
        return User.builder()
                .name(request.getName())
                .email(request.getEmail())
                .password(request.getPassword())
                .status(request.getStatus())
                .build();
    }
}
