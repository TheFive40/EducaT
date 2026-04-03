package com.educat.es.service;

import com.educat.es.domain.Course;
import com.educat.es.domain.Grade;
import com.educat.es.domain.Student;
import com.educat.es.repository.CourseRepository;
import com.educat.es.repository.GradeRepository;
import com.educat.es.repository.StudentRepository;
import com.optical.net.educat.domain.*;
import com.educat.es.dto.request.GradeRequest;
import com.educat.es.dto.response.GradeResponse;
import com.educat.es.mapper.GradeMapper;
import com.optical.net.educat.repository.*;
import com.educat.es.application.GradeService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GradeServiceImpl implements GradeService {
    private final GradeRepository gradeRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final GradeMapper gradeMapper;

    @Override @Transactional(readOnly = true)
    public List<GradeResponse> findAll() {
        return gradeRepository.findAll().stream().map(gradeMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public GradeResponse findById(Integer id) {
        return gradeRepository.findById(id).map(gradeMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Grade not found: " + id));
    }
    @Override
    public GradeResponse save(GradeRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Grade grade = gradeMapper.toEntity(request);
        grade.setStudent(student);
        grade.setCourse(course);
        return gradeMapper.toResponse(gradeRepository.save(grade));
    }
    @Override
    public GradeResponse update(Integer id, GradeRequest request) {
        Grade grade = gradeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Grade not found: " + id));
        grade.setGrade(request.getGrade());
        grade.setDescription(request.getDescription());
        return gradeMapper.toResponse(gradeRepository.save(grade));
    }
    @Override
    public void delete(Integer id) {
        if (!gradeRepository.existsById(id)) throw new EntityNotFoundException("Grade not found: " + id);
        gradeRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<GradeResponse> findByStudentId(Integer studentId) {
        return gradeRepository.findByStudentId(studentId).stream().map(gradeMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public List<GradeResponse> findByCourseId(Integer courseId) {
        return gradeRepository.findByCourseId(courseId).stream().map(gradeMapper::toResponse).toList();
    }
}
