package com.educat.es.service;

import com.educat.es.domain.Role;
import com.educat.es.domain.User;
import com.educat.es.dto.request.UserRequest;
import com.educat.es.dto.response.UserResponse;
import com.educat.es.mapper.UserMapper;
import com.educat.es.repository.RoleRepository;
import com.educat.es.repository.UserRepository;
import com.educat.es.application.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(userMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public UserResponse findById(Integer id) {
        return userRepository.findById(id).map(userMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
    }
    @Override
    public UserResponse save(UserRequest request) {
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + request.getRoleId()));
        User user = userMapper.toEntity(request);
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        return userMapper.toResponse(userRepository.save(user));
    }
    @Override
    public UserResponse update(Integer id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        Role role = roleRepository.findById(request.getRoleId())
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + request.getRoleId()));
        user.setName(request.getName());
        user.setEmail(request.getEmail());
        user.setRole(role);
        user.setStatus(request.getStatus());
        if (request.getPassword() != null && !request.getPassword().isBlank()) {
            user.setPassword(passwordEncoder.encode(request.getPassword()));
        }
        return userMapper.toResponse(userRepository.save(user));
    }
    @Override
    public void delete(Integer id) {
        if (!userRepository.existsById(id)) throw new EntityNotFoundException("User not found: " + id);
        userRepository.deleteById(id);
    }
}
