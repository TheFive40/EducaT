package com.github.net.educat.service;

import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.UserRequest;
import com.github.net.educat.dto.response.UserResponse;
import com.github.net.educat.mapper.UserMapper;
import com.github.net.educat.repository.RoleRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.UserRepository;
import com.github.net.educat.application.UserService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class UserServiceImpl implements UserService {
    private final UserRepository userRepository;
    private final RoleRepository roleRepository;
    private final StudentRepository studentRepository;
    private final UserMapper userMapper;
    private final PasswordEncoder passwordEncoder;

    @Override @Transactional(readOnly = true)
    public List<UserResponse> findAll() {
        return userRepository.findAll().stream().map(userMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public List<UserResponse> search(String query, Integer limit) {
        String q = normalize(query);
        int safeLimit = Math.max(1, Math.min(limit == null ? 20 : limit, 100));
        if (q.isBlank()) {
            return userRepository.findAll(
                            PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.ASC, "email")))
                    .stream()
                    .map(userMapper::toResponse)
                    .toList();
        }
        return userRepository
                .findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(
                        q,
                        q,
                        PageRequest.of(0, safeLimit, Sort.by(Sort.Direction.ASC, "email"))
                )
                .stream()
                .map(userMapper::toResponse)
                .toList();
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
        User saved = userRepository.save(user);
        ensureStudentProfileForRole(saved);
        return userMapper.toResponse(saved);
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
        User saved = userRepository.save(user);
        ensureStudentProfileForRole(saved);
        return userMapper.toResponse(saved);
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
        return findRoleByAlias(inferred)
                .or(() -> findRoleByAlias("ESTUDIANTE"))
                .orElseThrow(() -> new EntityNotFoundException("Role not found for registration"));
    }

    private String inferRoleNameByEmail(String email) {
        String value = String.valueOf(email == null ? "" : email).toLowerCase(Locale.ROOT);
        if (value.contains("admin") || value.startsWith("rector") || value.startsWith("coordinacion")) {
            return "ADMIN";
        }
        if (value.contains("docente") || value.contains("teacher") || value.contains("prof")) {
            return "PROFESOR";
        }
        return "ESTUDIANTE";
    }

    private Optional<Role> findRoleByAlias(String roleName) {
        String normalized = String.valueOf(roleName == null ? "" : roleName).trim().toUpperCase(Locale.ROOT);
        if (normalized.equals("ADMIN") || normalized.equals("ADMINISTRADOR")) {
            return roleRepository.findFirstByNameIgnoreCase("ADMIN")
                    .or(() -> roleRepository.findFirstByNameIgnoreCase("ADMINISTRADOR"));
        }
        if (normalized.equals("PROFESOR") || normalized.equals("DOCENTE") || normalized.equals("TEACHER")) {
            return roleRepository.findFirstByNameIgnoreCase("PROFESOR")
                    .or(() -> roleRepository.findFirstByNameIgnoreCase("DOCENTE"))
                    .or(() -> roleRepository.findFirstByNameIgnoreCase("TEACHER"));
        }
        if (normalized.equals("ESTUDIANTE") || normalized.equals("STUDENT")) {
            return roleRepository.findFirstByNameIgnoreCase("ESTUDIANTE")
                    .or(() -> roleRepository.findFirstByNameIgnoreCase("STUDENT"));
        }
        return roleRepository.findFirstByNameIgnoreCase(normalized);
    }

    private String normalize(String value) {
        return String.valueOf(value == null ? "" : value).trim();
    }

    private String normalizeEmail(String value) {
        return normalize(value).toLowerCase(Locale.ROOT);
    }

    private void ensureStudentProfileForRole(User user) {
        if (user == null || user.getId() == null || user.getRole() == null) return;
        String roleName = normalize(user.getRole().getName()).toUpperCase(Locale.ROOT);
        if (!roleName.equals("ESTUDIANTE") && !roleName.equals("STUDENT")) return;
        if (studentRepository.findByUserId(user.getId()).isPresent()) return;

        Student student = Student.builder()
                .user(user)
                .studentCode(String.format("EST-%06d", user.getId()))
                .build();
        studentRepository.save(student);
    }
}
