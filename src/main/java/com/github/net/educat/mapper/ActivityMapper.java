package com.github.net.educat.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.domain.Activity;
import com.github.net.educat.dto.request.ActivityRequest;
import com.github.net.educat.dto.response.ActivityResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ActivityMapper {
    private final CourseMapper courseMapper;
    private final ObjectMapper objectMapper;

    public ActivityResponse toResponse(Activity activity) {
        return ActivityResponse.builder()
                .id(activity.getId())
                .course(activity.getCourse() != null ? courseMapper.toResponse(activity.getCourse()) : null)
                .title(activity.getTitle())
                .description(activity.getDescription())
                .dueDate(activity.getDueDate())
                .dueTime(activity.getDueTime())
                .allowLateSubmission(activity.getAllowLateSubmission())
                .visibleFrom(activity.getVisibleFrom())
                .attachments(readList(activity.getAttachmentsJson()))
                .materials(readList(activity.getMaterialsJson()))
                .build();
    }
    public Activity toEntity(ActivityRequest request) {
        return Activity.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .dueDate(request.getDueDate())
                .dueTime(request.getDueTime())
                .allowLateSubmission(request.getAllowLateSubmission())
                .visibleFrom(request.getVisibleFrom())
                .attachmentsJson(writeList(request.getAttachments()))
                .materialsJson(writeList(request.getMaterials()))
                .build();
    }

    public String writeList(List<Object> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot serialize activity list");
        }
    }

    private List<Object> readList(String rawJson) {
        try {
            if (rawJson == null || rawJson.isBlank()) return Collections.emptyList();
            return objectMapper.readValue(rawJson, new TypeReference<>() {});
        } catch (Exception ex) {
            return Collections.emptyList();
        }
    }
}
