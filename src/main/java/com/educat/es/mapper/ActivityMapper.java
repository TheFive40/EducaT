package com.educat.es.mapper;

import com.educat.es.domain.Activity;
import com.educat.es.dto.request.ActivityRequest;
import com.educat.es.dto.response.ActivityResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ActivityMapper {
    private final CourseMapper courseMapper;

    public ActivityResponse toResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .course(activity.getCourse() != null ? courseMapper.toResponse(activity.getCourse()) : null)
                .title(activity.getTitle())
                .description(activity.getDescription())
                .dueDate(activity.getDueDate())
                .build();
    }
    public Activity toEntity(ActivityRequest request) {
        return Activity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .build();
    }
}
