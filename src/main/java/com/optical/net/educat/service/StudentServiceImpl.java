package com.optical.net.educat.service;

import com.optical.net.educat.domain.Student;
import com.optical.net.educat.domain.User;
import com.optical.net.educat.dto.request.StudentRequest;
import com.optical.net.educat.dto.response.StudentResponse;
import com.optical.net.educat.mapper.StudentMapper;
import com.optical.net.educat.repository.StudentRepository;
import com.optical.net.educat.repository.UserRepository;
import com.optical.net.educat.application.StudentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
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
        return studentMapper.toResponse(studentRepository.save(student));
    }
    @Override
    public StudentResponse update(Integer id, StudentRequest request) {
        Student student = studentRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + id));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        student.setUser(user);
        student.setStudentCode(request.getStudentCode());
        return studentMapper.toResponse(studentRepository.save(student));
    }
    @Override
    public void delete(Integer id) {
        if (!studentRepository.existsById(id)) throw new EntityNotFoundException("Student not found: " + id);
        studentRepository.deleteById(id);
    }
}
