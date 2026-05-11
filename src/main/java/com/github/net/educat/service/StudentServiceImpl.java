package com.github.net.educat.service;

import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.StudentRequest;
import com.github.net.educat.dto.response.StudentResponse;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.application.AuditLogService;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.UserRepository;
import com.github.net.educat.application.StudentService;
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
public class StudentServiceImpl implements StudentService {
    private final StudentRepository studentRepository;
    private final UserRepository userRepository;
    private final StudentMapper studentMapper;
    private final AuditLogService auditLogService;

    private String currentActorEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @Override @Transactional(readOnly = true)
    public List<StudentResponse> findAll() {
        return studentRepository.findAll().stream().map(studentMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public StudentResponse findById(Integer id) {
        return studentRepository.findById(id).map(studentMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + id));
    }
    @Override
    public StudentResponse save(StudentRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        Student student = studentMapper.toEntity(request);
        student.setUser(user);
        Student saved = studentRepository.save(student);
        auditLogService.log(currentActorEmail(), "CREATE", "STUDENT", String.valueOf(saved.getId()),
                "Estudiante creado: userId=" + saved.getUser().getId());
        return studentMapper.toResponse(saved);
    }
    @Override
    public StudentResponse update(Integer id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + id));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        student.setUser(user);
        student.setStudentCode(request.getStudentCode());
        Student saved = studentRepository.save(student);
        auditLogService.log(currentActorEmail(), "UPDATE", "STUDENT", String.valueOf(saved.getId()),
                "Estudiante actualizado: userId=" + saved.getUser().getId());
        return studentMapper.toResponse(saved);
    }
    @Override
    public void delete(Integer id) {
        if (!studentRepository.existsById(id)) throw new EntityNotFoundException("Student not found: " + id);
        Student student = studentRepository.findById(id).orElse(null);
        studentRepository.deleteById(id);
        auditLogService.log(currentActorEmail(), "DELETE", "STUDENT", String.valueOf(id),
                "Estudiante eliminado: " + (student != null && student.getUser() != null ? student.getUser().getEmail() : "unknown"));
    }
}
