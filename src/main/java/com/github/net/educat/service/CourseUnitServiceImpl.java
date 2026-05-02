package com.github.net.educat.service;

import com.github.net.educat.application.CourseUnitService;
import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.CourseUnit;
import com.github.net.educat.dto.request.CourseUnitRequest;
import com.github.net.educat.dto.response.CourseUnitResponse;
import com.github.net.educat.mapper.CourseUnitMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.CourseUnitRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseUnitServiceImpl implements CourseUnitService {
    private final CourseUnitRepository courseUnitRepository;
    private final CourseRepository courseRepository;
    private final CourseUnitMapper courseUnitMapper;

    @Override
    @Transactional(readOnly = true)
    public List<CourseUnitResponse> findAll() {
        return courseUnitRepository.findAll().stream()
                .map(courseUnitMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<CourseUnitResponse> findByCourseId(Integer courseId) {
        return courseUnitRepository.findByCourseIdOrderByIdAsc(courseId).stream()
                .map(courseUnitMapper::toResponse)
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public CourseUnitResponse findById(Integer id) {
        return courseUnitRepository.findById(id)
                .map(courseUnitMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Course unit not found: " + id));
    }

    @Override
    public CourseUnitResponse save(CourseUnitRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        CourseUnit entity = courseUnitMapper.toEntity(request);
        entity.setCourse(course);
        return courseUnitMapper.toResponse(courseUnitRepository.save(entity));
    }

    @Override
    public CourseUnitResponse update(Integer id, CourseUnitRequest request) {
        CourseUnit existing = courseUnitRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course unit not found: " + id));
        if (request.getCourseId() != null) {
            Course course = courseRepository.findById(request.getCourseId())
                    .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
            existing.setCourse(course);
        }
        existing.setName(request.getName());
        existing.setWelcome(request.getWelcome());
        existing.setDescription(request.getDescription());
        existing.setAnnouncementsJson(request.getAnnouncementsJson());
        existing.setActivityIdsJson(request.getActivityIdsJson());
        existing.setExamIdsJson(request.getExamIdsJson());
        existing.setResourcesJson(request.getResourcesJson());
        existing.setForumsJson(request.getForumsJson());
        existing.setGlossariesJson(request.getGlossariesJson());
        return courseUnitMapper.toResponse(courseUnitRepository.save(existing));
    }

    @Override
    public void delete(Integer id) {
        if (!courseUnitRepository.existsById(id)) {
            throw new EntityNotFoundException("Course unit not found: " + id);
        }
        courseUnitRepository.deleteById(id);
    }
}