package com.github.net.educat.service;

import com.github.net.educat.domain.Teacher;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.request.TeacherRequest;
import com.github.net.educat.dto.response.TeacherResponse;
import com.github.net.educat.mapper.TeacherMapper;
import com.github.net.educat.application.AuditLogService;
import com.github.net.educat.repository.TeacherRepository;
import com.github.net.educat.repository.UserRepository;
import com.github.net.educat.application.TeacherService;
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
public class TeacherServiceImpl implements TeacherService {
    private final TeacherRepository teacherRepository;
    private final UserRepository userRepository;
    private final TeacherMapper teacherMapper;
    private final AuditLogService auditLogService;

    private String currentActorEmail() {
        Authentication auth = SecurityContextHolder.getContext().getAuthentication();
        return auth != null ? auth.getName() : "system";
    }

    @Override @Transactional(readOnly = true)
    public List<TeacherResponse> findAll() {
        return teacherRepository.findAll().stream().map(teacherMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public TeacherResponse findById(Integer id) {
        return teacherRepository.findById(id).map(teacherMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + id));
    }
    @Override
    public TeacherResponse save(TeacherRequest request) {
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        Teacher teacher = teacherMapper.toEntity(request);
        teacher.setUser(user);
        Teacher saved = teacherRepository.save(teacher);
        auditLogService.log(currentActorEmail(), "CREATE", "TEACHER", String.valueOf(saved.getId()),
                "Profesor creado: userId=" + saved.getUser().getId());
        return teacherMapper.toResponse(saved);
    }
    @Override
    public TeacherResponse update(Integer id, TeacherRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + id));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        teacher.setUser(user);
        teacher.setSpecialization(request.getSpecialization());
        Teacher saved = teacherRepository.save(teacher);
        auditLogService.log(currentActorEmail(), "UPDATE", "TEACHER", String.valueOf(saved.getId()),
                "Profesor actualizado: userId=" + saved.getUser().getId());
        return teacherMapper.toResponse(saved);
    }
    @Override
    public void delete(Integer id) {
        if (!teacherRepository.existsById(id)) throw new EntityNotFoundException("Teacher not found: " + id);
        Teacher teacher = teacherRepository.findById(id).orElse(null);
        teacherRepository.deleteById(id);
        auditLogService.log(currentActorEmail(), "DELETE", "TEACHER", String.valueOf(id),
                "Profesor eliminado: " + (teacher != null && teacher.getUser() != null ? teacher.getUser().getEmail() : "unknown"));
    }
}
