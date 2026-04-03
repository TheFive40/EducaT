package com.github.net.educat.mapper;

import com.github.net.educat.domain.Activity;
import com.github.net.educat.dto.request.ActivityRequest;
import com.github.net.educat.dto.response.ActivityResponse;
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
