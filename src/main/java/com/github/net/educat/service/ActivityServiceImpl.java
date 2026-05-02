package com.github.net.educat.service;

import com.github.net.educat.domain.Activity;
import com.github.net.educat.domain.Course;
import com.github.net.educat.repository.ActivityRepository;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.dto.request.ActivityRequest;
import com.github.net.educat.dto.response.ActivityResponse;
import com.github.net.educat.mapper.ActivityMapper;
import com.github.net.educat.application.ActivityService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivityServiceImpl implements ActivityService {
    private final ActivityRepository activityRepository;
    private final CourseRepository courseRepository;
    private final ActivityMapper activityMapper;

    @Override @Transactional(readOnly = true)
    public List<ActivityResponse> findAll() {
        return activityRepository.findAll().stream().map(activityMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ActivityResponse findById(Integer id) {
        return activityRepository.findById(id).map(activityMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found: " + id));
    }
    @Override
    public ActivityResponse save(ActivityRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Activity activity = activityMapper.toEntity(request);
        activity.setCourse(course);
        return activityMapper.toResponse(activityRepository.save(activity));
    }
    @Override
    public ActivityResponse update(Integer id, ActivityRequest request) {
        Activity activity = activityRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Activity not found: " + id));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        activity.setCourse(course);
        activity.setTitle(request.getTitle());
        activity.setDescription(request.getDescription());
        activity.setDueDate(request.getDueDate());
        activity.setDueTime(request.getDueTime());
        activity.setAllowLateSubmission(request.getAllowLateSubmission());
        activity.setVisibleFrom(request.getVisibleFrom());
        activity.setAttachmentsJson(activityMapper.writeList(request.getAttachments()));
        activity.setMaterialsJson(activityMapper.writeList(request.getMaterials()));
        return activityMapper.toResponse(activityRepository.save(activity));
    }
    @Override
    public void delete(Integer id) {
        if (!activityRepository.existsById(id)) throw new EntityNotFoundException("Activity not found: " + id);
        activityRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<ActivityResponse> findByCourseId(Integer courseId) {
        return activityRepository.findByCourseId(courseId).stream().map(activityMapper::toResponse).toList();
    }
}
