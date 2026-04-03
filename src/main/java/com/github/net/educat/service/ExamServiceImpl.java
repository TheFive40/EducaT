package com.github.net.educat.service;

import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Exam;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.ExamRepository;
import com.github.net.educat.dto.request.ExamRequest;
import com.github.net.educat.dto.response.ExamResponse;
import com.github.net.educat.mapper.ExamMapper;
import com.github.net.educat.application.ExamService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamServiceImpl implements ExamService {
    private final ExamRepository examRepository;
    private final CourseRepository courseRepository;
    private final ExamMapper examMapper;

    @Override @Transactional(readOnly = true)
    public List<ExamResponse> findAll() {
        return examRepository.findAll().stream().map(examMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ExamResponse findById(Integer id) {
        return examRepository.findById(id).map(examMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + id));
    }
    @Override
    public ExamResponse save(ExamRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Exam exam = examMapper.toEntity(request);
        exam.setCourse(course);
        return examMapper.toResponse(examRepository.save(exam));
    }
    @Override
    public ExamResponse update(Integer id, ExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + id));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        exam.setCourse(course);
        exam.setTitle(request.getTitle());
        exam.setExamDate(request.getExamDate());
        return examMapper.toResponse(examRepository.save(exam));
    }
    @Override
    public void delete(Integer id) {
        if (!examRepository.existsById(id)) throw new EntityNotFoundException("Exam not found: " + id);
        examRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<ExamResponse> findByCourseId(Integer courseId) {
        return examRepository.findByCourseId(courseId).stream().map(examMapper::toResponse).toList();
    }
}
