package com.github.net.educat.mapper;

import com.github.net.educat.domain.CourseUnit;
import com.github.net.educat.dto.request.CourseUnitRequest;
import com.github.net.educat.dto.response.CourseUnitResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CourseUnitMapper {

    public CourseUnitResponse toResponse(CourseUnit unit) {
        if (unit == null) return null;
        return CourseUnitResponse.builder()
                .id(unit.getId())
                .courseId(unit.getCourse() != null ? unit.getCourse().getId() : null)
                .name(unit.getName())
                .welcome(unit.getWelcome())
                .description(unit.getDescription())
                .announcementsJson(unit.getAnnouncementsJson())
                .activityIdsJson(unit.getActivityIdsJson())
                .examIdsJson(unit.getExamIdsJson())
                .resourcesJson(unit.getResourcesJson())
                .forumsJson(unit.getForumsJson())
                .glossariesJson(unit.getGlossariesJson())
                .build();
    }

    public CourseUnit toEntity(CourseUnitRequest request) {
        if (request == null) return null;
        return CourseUnit.builder()
                .name(request.getName())
                .welcome(request.getWelcome())
                .description(request.getDescription())
                .announcementsJson(request.getAnnouncementsJson())
                .activityIdsJson(request.getActivityIdsJson())
                .examIdsJson(request.getExamIdsJson())
                .resourcesJson(request.getResourcesJson())
                .forumsJson(request.getForumsJson())
                .glossariesJson(request.getGlossariesJson())
                .build();
    }
}