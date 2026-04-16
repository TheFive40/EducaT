package com.github.net.educat.service;

import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.UserRequest;
import com.github.net.educat.dto.response.UserResponse;
import com.github.net.educat.mapper.UserMapper;
import com.github.net.educat.repository.RoleRepository;
import com.github.net.educat.repository.UserRepository;
import com.github.net.educat.application.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;

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
        String name = normalize(request.getName());
        String email = normalizeEmail(request.getEmail());
        if (name.isBlank()) throw new IllegalArgumentException("El nombre es obligatorio");
        if (email.isBlank()) throw new IllegalArgumentException("El correo es obligatorio");
        if (request.getPassword() == null || request.getPassword().isBlank()) {
            throw new IllegalArgumentException("La contraseña es obligatoria para crear usuario");
        }
        if (userRepository.existsByEmail(email)) {
            throw new IllegalArgumentException("Ya existe un usuario con el correo: " + email);
        }
        Role role = resolveRoleForRegistration(request);
        User user = userMapper.toEntity(request);
        user.setName(name);
        user.setEmail(email);
        user.setDocumentId(normalize(request.getDocumentId()));
        user.setPhone(normalize(request.getPhone()));
        user.setRole(role);
        user.setPassword(passwordEncoder.encode(request.getPassword()));
        user.setCreatedAt(LocalDateTime.now());
        user.setStatus(request.getStatus() != null ? request.getStatus() : Boolean.TRUE);
        return userMapper.toResponse(userRepository.save(user));
    }
    @Override
    public UserResponse update(Integer id, UserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + id));
        Role role = user.getRole();
        if (request.getRoleId() != null) {
            role = roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new EntityNotFoundException("Role not found: " + request.getRoleId()));
        }
        String name = normalize(request.getName());
        String email = normalizeEmail(request.getEmail());
        if (name.isBlank()) throw new IllegalArgumentException("El nombre es obligatorio");
        if (email.isBlank()) throw new IllegalArgumentException("El correo es obligatorio");
        if (!email.equalsIgnoreCase(String.valueOf(user.getEmail()))) {
            boolean exists = userRepository.findByEmail(email)
                    .map(other -> !other.getId().equals(user.getId()))
                    .orElse(false);
            if (exists) throw new IllegalArgumentException("Ya existe un usuario con el correo: " + email);
        }
        user.setName(name);
        user.setEmail(email);
        user.setDocumentId(normalize(request.getDocumentId()));
        user.setPhone(normalize(request.getPhone()));
        user.setRole(role);
        if (request.getStatus() != null) {
            user.setStatus(request.getStatus());
        }
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

    private Role resolveRoleForRegistration(UserRequest request) {
        if (request.getRoleId() != null) {
            return roleRepository.findById(request.getRoleId())
                    .orElseThrow(() -> new EntityNotFoundException("Role not found: " + request.getRoleId()));
        }
        String inferred = inferRoleNameByEmail(request.getEmail());
        return roleRepository.findFirstByNameIgnoreCase(inferred)
                .or(() -> roleRepository.findFirstByNameIgnoreCase("ESTUDIANTE"))
                .orElseThrow(() -> new EntityNotFoundException("Role not found for registration"));
    }

    private String inferRoleNameByEmail(String email) {
        String value = String.valueOf(email == null ? "" : email).toLowerCase(Locale.ROOT);
        if (value.contains("admin") || value.startsWith("rector") || value.startsWith("coordinacion")) {
            return "ADMIN";
        }
        if (value.contains("docente") || value.contains("teacher") || value.contains("prof")) {
            return "DOCENTE";
        }
        return "ESTUDIANTE";
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value).trim();
    }

    private String normalizeEmail(String value) {
        return normalize(value).toLowerCase(Locale.ROOT);
    }
}
