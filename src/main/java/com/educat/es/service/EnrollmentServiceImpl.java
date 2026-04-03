package com.educat.es.service;

import com.educat.es.domain.Course;
import com.educat.es.domain.Enrollment;
import com.educat.es.domain.Student;
import com.educat.es.repository.CourseRepository;
import com.educat.es.repository.EnrollmentRepository;
import com.educat.es.repository.StudentRepository;
import com.optical.net.educat.domain.*;
import com.educat.es.dto.request.EnrollmentRequest;
import com.educat.es.dto.response.EnrollmentResponse;
import com.educat.es.mapper.EnrollmentMapper;
import com.optical.net.educat.repository.*;
import com.educat.es.application.EnrollmentService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class EnrollmentServiceImpl implements EnrollmentService {
    private final EnrollmentRepository enrollmentRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentMapper enrollmentMapper;

    @Override @Transactional(readOnly = true)
    public List<EnrollmentResponse> findAll() {
        return enrollmentRepository.findAll().stream().map(enrollmentMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public EnrollmentResponse findById(Integer id) {
        return enrollmentRepository.findById(id).map(enrollmentMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Enrollment not found: " + id));
    }
    @Override
    public EnrollmentResponse save(EnrollmentRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Enrollment enrollment = enrollmentMapper.toEntity(request);
        enrollment.setStudent(student);
        enrollment.setCourse(course);
        enrollment.setEnrollmentDate(request.getEnrollmentDate() != null ? request.getEnrollmentDate() : LocalDateTime.now());
        return enrollmentMapper.toResponse(enrollmentRepository.save(enrollment));
    }
    @Override
    public void delete(Integer id) {
        if (!enrollmentRepository.existsById(id)) throw new EntityNotFoundException("Enrollment not found: " + id);
        enrollmentRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<EnrollmentResponse> findByStudentId(Integer studentId) {
        return enrollmentRepository.findByStudentId(studentId).stream().map(enrollmentMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public List<EnrollmentResponse> findByCourseId(Integer courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream().map(enrollmentMapper::toResponse).toList();
    }
}
