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
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.security.crypto.password.PasswordEncoder;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class UserServiceImplTest {

    @Mock
    private UserRepository userRepository;
    @Mock
    private RoleRepository roleRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private UserMapper userMapper;
    @Mock
    private PasswordEncoder passwordEncoder;

    @Test
    void save_whenRoleIsStudent_createsStudentProfileIfMissing() {
        UserServiceImpl service = new UserServiceImpl(userRepository, roleRepository, studentRepository, userMapper, passwordEncoder);
        UserRequest request = UserRequest.builder()
                .name("Ana")
                .email("ana@test.com")
                .password("12345678")
                .roleId(3)
                .status(true)
                .build();
        Role role = Role.builder().id(3).name("ESTUDIANTE").build();

        when(userRepository.existsByEmail("ana@test.com")).thenReturn(false);
        when(roleRepository.findById(3)).thenReturn(Optional.of(role));
        when(userMapper.toEntity(request)).thenReturn(User.builder().build());
        when(passwordEncoder.encode("12345678")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(7);
            return u;
        });
        when(studentRepository.findByUserId(7)).thenReturn(Optional.empty());
        when(userMapper.toResponse(any(User.class))).thenReturn(UserResponse.builder().id(7).build());

        service.save(request);

        ArgumentCaptor<Student> studentCaptor = ArgumentCaptor.forClass(Student.class);
        verify(studentRepository).save(studentCaptor.capture());
        assertEquals(7, studentCaptor.getValue().getUser().getId());
        assertEquals("EST-000007", studentCaptor.getValue().getStudentCode());
    }

    @Test
    void save_whenRoleIsTeacher_doesNotCreateStudentProfile() {
        UserServiceImpl service = new UserServiceImpl(userRepository, roleRepository, studentRepository, userMapper, passwordEncoder);
        UserRequest request = UserRequest.builder()
                .name("Luis")
                .email("luis@test.com")
                .password("12345678")
                .roleId(2)
                .status(true)
                .build();
        Role role = Role.builder().id(2).name("DOCENTE").build();

        when(userRepository.existsByEmail("luis@test.com")).thenReturn(false);
        when(roleRepository.findById(2)).thenReturn(Optional.of(role));
        when(userMapper.toEntity(request)).thenReturn(User.builder().build());
        when(passwordEncoder.encode("12345678")).thenReturn("encoded");
        when(userRepository.save(any(User.class))).thenAnswer(inv -> {
            User u = inv.getArgument(0);
            u.setId(8);
            return u;
        });
        when(userMapper.toResponse(any(User.class))).thenReturn(UserResponse.builder().id(8).build());

        service.save(request);

        verify(studentRepository, never()).save(any(Student.class));
    }
}

