package com.optical.net.educat.service;

import com.optical.net.educat.domain.Teacher;
import com.optical.net.educat.domain.User;
import com.optical.net.educat.dto.request.TeacherRequest;
import com.optical.net.educat.dto.response.TeacherResponse;
import com.optical.net.educat.mapper.TeacherMapper;
import com.optical.net.educat.repository.TeacherRepository;
import com.optical.net.educat.repository.UserRepository;
import com.optical.net.educat.application.TeacherService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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
        return teacherMapper.toResponse(teacherRepository.save(teacher));
    }
    @Override
    public TeacherResponse update(Integer id, TeacherRequest request) {
        Teacher teacher = teacherRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + id));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        teacher.setUser(user);
        teacher.setSpecialization(request.getSpecialization());
        return teacherMapper.toResponse(teacherRepository.save(teacher));
    }
    @Override
    public void delete(Integer id) {
        if (!teacherRepository.existsById(id)) throw new EntityNotFoundException("Teacher not found: " + id);
        teacherRepository.deleteById(id);
    }
}
