package com.github.net.educat.controller;

import com.github.net.educat.domain.User;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.response.UserResponse;
import com.github.net.educat.mapper.UserMapper;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.UserRepository;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpSession;
import jakarta.validation.Valid;
import jakarta.validation.constraints.NotBlank;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.Authentication;
import org.springframework.security.core.context.SecurityContext;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.security.Principal;
import java.util.Locale;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {
    private final UserRepository userRepository;
    private final StudentRepository studentRepository;
    private final UserMapper userMapper;
    private final AuthenticationManager authenticationManager;

    @PostMapping("/login")
    public ResponseEntity<UserResponse> login(@Valid @RequestBody LoginRequest request, HttpServletRequest httpRequest) {
        Authentication authentication = authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );
        SecurityContext context = SecurityContextHolder.createEmptyContext();
        context.setAuthentication(authentication);
        SecurityContextHolder.setContext(context);
        HttpSession session = httpRequest.getSession(true);
        session.setAttribute("SPRING_SECURITY_CONTEXT", context);

        User user = userRepository.findByEmail(request.getEmail().trim().toLowerCase())
                .orElseThrow(() -> new BadCredentialsException("Invalid credentials"));
        ensureStudentProfileIfNeeded(user);
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @GetMapping("/me")
    public ResponseEntity<UserResponse> me(Principal principal) {
        String email = principal.getName();
        User user = userRepository.findByEmail(email)
                .orElseThrow(() -> new IllegalArgumentException("Authenticated user not found: " + email));
        return ResponseEntity.ok(userMapper.toResponse(user));
    }

    @PostMapping("/logout")
    public ResponseEntity<Void> logout(HttpServletRequest request) {
        var session = request.getSession(false);
        if (session != null) session.invalidate();
        return ResponseEntity.noContent().build();
    }

    public static class LoginRequest {
        @NotBlank
        private String email;
        @NotBlank
        private String password;

        public String getEmail() { return email; }
        public void setEmail(String email) { this.email = email; }
        public String getPassword() { return password; }
        public void setPassword(String password) { this.password = password; }
    }

    private void ensureStudentProfileIfNeeded(User user) {
        if (user == null || user.getId() == null || user.getRole() == null) return;
        String roleName = String.valueOf(user.getRole().getName() == null ? "" : user.getRole().getName())
                .trim()
                .toUpperCase(Locale.ROOT);
        if (!roleName.equals("ESTUDIANTE") && !roleName.equals("STUDENT")) return;
        if (studentRepository.findByUserId(user.getId()).isPresent()) return;
        studentRepository.save(Student.builder()
                .user(user)
                .studentCode(String.format("EST-%06d", user.getId()))
                .build());
    }
}


