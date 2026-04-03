package com.educat.es.service;

import com.educat.es.domain.Student;
import com.educat.es.domain.User;
import com.educat.es.dto.request.StudentRequest;
import com.educat.es.dto.response.StudentResponse;
import com.educat.es.mapper.StudentMapper;
import com.educat.es.repository.StudentRepository;
import com.educat.es.repository.UserRepository;
import com.educat.es.application.StudentService;
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
