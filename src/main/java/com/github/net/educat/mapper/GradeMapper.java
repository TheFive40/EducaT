package com.github.net.educat.mapper;

import com.github.net.educat.domain.Grade;
import com.github.net.educat.dto.request.GradeRequest;
import com.github.net.educat.dto.response.GradeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class GradeMapper {
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;

    public GradeResponse toResponse(Grade grade) {
        return GradeResponse.builder()
                .id(grade.getId())
                .student(grade.getStudent() != null ? studentMapper.toResponse(grade.getStudent()) : null)
                .course(grade.getCourse() != null ? courseMapper.toResponse(grade.getCourse()) : null)
                .activityId(grade.getActivityId())
                .sourceUnitId(grade.getSourceUnitId())
                .source(grade.getSource())
                .grade(grade.getGrade())
                .description(grade.getDescription())
                .build();
    }
    public Grade toEntity(GradeRequest request) {
        return Grade.builder()
                .activityId(request.getActivityId())
                .sourceUnitId(request.getSourceUnitId())
                .source(request.getSource())
                .grade(request.getGrade())
                .description(request.getDescription())
                .build();
    }
}
