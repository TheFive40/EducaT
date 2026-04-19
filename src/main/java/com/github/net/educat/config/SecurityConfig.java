package com.github.net.educat.config;

import com.github.net.educat.domain.User;
import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpStatus;
import org.springframework.http.HttpMethod;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.core.userdetails.UsernameNotFoundException;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.authentication.HttpStatusEntryPoint;
import org.springframework.security.web.SecurityFilterChain;

import java.util.List;
import java.util.Locale;

@Configuration
@EnableWebSecurity
@RequiredArgsConstructor
public class SecurityConfig {
    private final UserRepository userRepository;
    private final AccessControlService accessControlService;

    @Bean
    public SecurityFilterChain securityFilterChain(HttpSecurity http) throws Exception {
        http
                .csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .sessionManagement(session -> session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED))
                .authorizeHttpRequests(auth -> auth
                        .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                        .requestMatchers("/api/auth/**").permitAll()
                        .requestMatchers(HttpMethod.GET, "/api/news/**", "/api/forums/**").permitAll()
                        .requestMatchers("/admin-dashboard", "/admin-dashboard/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ADMINISTRADOR", "PORTAL_ADMIN")
                        .requestMatchers("/teacher-dashboard", "/teacher-dashboard/**").hasAnyAuthority("ROLE_DOCENTE", "ROLE_TEACHER", "ROLE_PROFESOR", "PORTAL_TEACHER")
                        .requestMatchers("/student-dashboard", "/student-dashboard/**").hasAnyAuthority("ROLE_ESTUDIANTE", "ROLE_STUDENT", "PORTAL_STUDENT")
                        .requestMatchers("/api/admin/**").hasAnyAuthority("ROLE_ADMIN", "ROLE_ADMINISTRADOR", "PORTAL_ADMIN")
                        .requestMatchers("/api/teacher/**").hasAnyAuthority("ROLE_DOCENTE", "ROLE_TEACHER", "ROLE_PROFESOR", "PORTAL_TEACHER")
                        .requestMatchers("/api/student/**").hasAnyAuthority("ROLE_ESTUDIANTE", "ROLE_STUDENT", "PORTAL_STUDENT")
                        .requestMatchers("/api/**").authenticated()
                        .anyRequest().permitAll()
                )
                .exceptionHandling(ex -> ex
                        .authenticationEntryPoint(new HttpStatusEntryPoint(HttpStatus.UNAUTHORIZED))
                        .accessDeniedHandler((request, response, accessDeniedException) -> response.sendError(HttpStatus.FORBIDDEN.value()))
                );
        return http.build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public UserDetailsService userDetailsService() {
        return username -> {
            final String email = String.valueOf(username == null ? "" : username).trim().toLowerCase(Locale.ROOT);
            User user = userRepository.findByEmail(email)
                    .orElseThrow(() -> new UsernameNotFoundException("User not found: " + email));
            if (user.getStatus() != null && !user.getStatus()) {
                throw new UsernameNotFoundException("User disabled: " + email);
            }
            String roleName = user.getRole() != null ? String.valueOf(user.getRole().getName()) : "USER";
            List<SimpleGrantedAuthority> authorities = new java.util.ArrayList<>();
            authorities.add(new SimpleGrantedAuthority("ROLE_" + roleName.toUpperCase(Locale.ROOT)));
            accessControlService.getGrantedAuthorities(user)
                    .forEach(a -> authorities.add(new SimpleGrantedAuthority(a)));
            return org.springframework.security.core.userdetails.User.builder()
                    .username(user.getEmail())
                    .password(user.getPassword())
                    .authorities(authorities)
                    .build();
        };
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration configuration) throws Exception {
        return configuration.getAuthenticationManager();
    }
}
