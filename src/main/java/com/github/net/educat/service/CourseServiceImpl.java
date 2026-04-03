package com.github.net.educat.service;

import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Teacher;
import com.github.net.educat.dto.request.CourseRequest;
import com.github.net.educat.dto.response.CourseResponse;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.TeacherRepository;
import com.github.net.educat.application.CourseService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final CourseMapper courseMapper;

    @Override @Transactional(readOnly = true)
    public List<CourseResponse> findAll() {
        return courseRepository.findAll().stream().map(courseMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public CourseResponse findById(Integer id) {
        return courseRepository.findById(id).map(courseMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + id));
    }
    @Override
    public CourseResponse save(CourseRequest request) {
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + request.getTeacherId()));
        Course course = courseMapper.toEntity(request);
        course.setTeacher(teacher);
        return courseMapper.toResponse(courseRepository.save(course));
    }
    @Override
    public CourseResponse update(Integer id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + id));
        Teacher teacher = teacherRepository.findById(request.getTeacherId())
                .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + request.getTeacherId()));
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setTeacher(teacher);
        return courseMapper.toResponse(courseRepository.save(course));
    }
    @Override
    public void delete(Integer id) {
        if (!courseRepository.existsById(id)) throw new EntityNotFoundException("Course not found: " + id);
        courseRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<CourseResponse> findByTeacherId(Integer teacherId) {
        return courseRepository.findByTeacherId(teacherId).stream().map(courseMapper::toResponse).toList();
    }
}
