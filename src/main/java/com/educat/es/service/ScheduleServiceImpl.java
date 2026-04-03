package com.educat.es.service;

import com.educat.es.domain.Course;
import com.educat.es.domain.Schedule;
import com.educat.es.repository.CourseRepository;
import com.educat.es.repository.ScheduleRepository;
import com.optical.net.educat.domain.*;
import com.educat.es.dto.request.ScheduleRequest;
import com.educat.es.dto.response.ScheduleResponse;
import com.educat.es.mapper.ScheduleMapper;
import com.optical.net.educat.repository.*;
import com.educat.es.application.ScheduleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ScheduleServiceImpl implements ScheduleService {
    private final ScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;
    private final ScheduleMapper scheduleMapper;

    @Override @Transactional(readOnly = true)
    public List<ScheduleResponse> findAll() {
        return scheduleRepository.findAll().stream().map(scheduleMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ScheduleResponse findById(Integer id) {
        return scheduleRepository.findById(id).map(scheduleMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found: " + id));
    }
    @Override
    public ScheduleResponse save(ScheduleRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Schedule schedule = scheduleMapper.toEntity(request);
        schedule.setCourse(course);
        return scheduleMapper.toResponse(scheduleRepository.save(schedule));
    }
    @Override
    public ScheduleResponse update(Integer id, ScheduleRequest request) {
        Schedule schedule = scheduleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Schedule not found: " + id));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        schedule.setCourse(course);
        schedule.setDay(request.getDay());
        schedule.setStartTime(request.getStartTime());
        schedule.setEndTime(request.getEndTime());
        return scheduleMapper.toResponse(scheduleRepository.save(schedule));
    }
    @Override
    public void delete(Integer id) {
        if (!scheduleRepository.existsById(id)) throw new EntityNotFoundException("Schedule not found: " + id);
        scheduleRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<ScheduleResponse> findByCourseId(Integer courseId) {
        return scheduleRepository.findByCourseId(courseId).stream().map(scheduleMapper::toResponse).toList();
    }
}
