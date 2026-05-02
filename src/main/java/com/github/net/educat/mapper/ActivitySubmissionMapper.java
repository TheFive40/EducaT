package com.github.net.educat.mapper;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.domain.ActivitySubmission;
import com.github.net.educat.dto.request.ActivitySubmissionRequest;
import com.github.net.educat.dto.response.ActivitySubmissionResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

import java.util.Collections;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ActivitySubmissionMapper {
    private final ActivityMapper activityMapper;
    private final StudentMapper studentMapper;
    private final ObjectMapper objectMapper;

    public ActivitySubmissionResponse toResponse(ActivitySubmission submission) {
        return ActivitySubmissionResponse.builder()
                .id(submission.getId())
                .activity(submission.getActivity() != null ? activityMapper.toResponse(submission.getActivity()) : null)
                .student(submission.getStudent() != null ? studentMapper.toResponse(submission.getStudent()) : null)
                .comment(submission.getComment())
                .files(readList(submission.getFilesJson()))
                .submittedAt(submission.getSubmittedAt())
                .isLate(submission.getIsLate())
                .grade(submission.getGrade())
                .feedback(submission.getFeedback())
                .gradedAt(submission.getGradedAt())
                .build();
    }

    public ActivitySubmission toEntity(ActivitySubmissionRequest request) {
        return ActivitySubmission.builder()
                .comment(request.getComment())
                .filesJson(writeList(request.getFiles()))
                .isLate(request.getIsLate())
                .grade(request.getGrade())
                .feedback(request.getFeedback())
                .build();
    }

    public String writeList(List<Object> values) {
        try {
            return objectMapper.writeValueAsString(values == null ? Collections.emptyList() : values);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot serialize submission files");
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
