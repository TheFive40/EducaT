package com.optical.net.educat.service;

import com.optical.net.educat.domain.*;
import com.optical.net.educat.dto.request.StudentWellbeingRequest;
import com.optical.net.educat.dto.response.StudentWellbeingResponse;
import com.optical.net.educat.mapper.StudentWellbeingMapper;
import com.optical.net.educat.repository.*;
import com.optical.net.educat.application.StudentWellbeingService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class StudentWellbeingServiceImpl implements StudentWellbeingService {
    private final StudentWellbeingRepository wellbeingRepository;
    private final StudentRepository studentRepository;
    private final StudentWellbeingMapper wellbeingMapper;

    @Override @Transactional(readOnly = true)
    public List<StudentWellbeingResponse> findAll() {
        return wellbeingRepository.findAll().stream().map(wellbeingMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public StudentWellbeingResponse findById(Integer id) {
        return wellbeingRepository.findById(id).map(wellbeingMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("StudentWellbeing not found: " + id));
    }
    @Override
    public StudentWellbeingResponse save(StudentWellbeingRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        StudentWellbeing wellbeing = wellbeingMapper.toEntity(request);
        wellbeing.setStudent(student);
        wellbeing.setCreatedAt(LocalDateTime.now());
        return wellbeingMapper.toResponse(wellbeingRepository.save(wellbeing));
    }
    @Override
    public void delete(Integer id) {
        if (!wellbeingRepository.existsById(id)) throw new EntityNotFoundException("StudentWellbeing not found: " + id);
        wellbeingRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<StudentWellbeingResponse> findByStudentId(Integer studentId) {
        return wellbeingRepository.findByStudentId(studentId).stream().map(wellbeingMapper::toResponse).toList();
    }
}
