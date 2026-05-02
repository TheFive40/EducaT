package com.github.net.educat.mapper;

import com.github.net.educat.domain.AcademicGrade;
import com.github.net.educat.dto.request.AcademicGradeRequest;
import com.github.net.educat.dto.response.AcademicGradeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AcademicGradeMapper {
    private final AcademicLevelMapper academicLevelMapper;

    public AcademicGradeResponse toResponse(AcademicGrade grade) {
        return AcademicGradeResponse.builder()
                .id(grade.getId())
                .levelId(grade.getLevel() != null ? grade.getLevel().getId() : null)
                .levelName(grade.getLevel() != null ? grade.getLevel().getName() : null)
                .name(grade.getName())
                .build();
    }

    public AcademicGrade toEntity(AcademicGradeRequest request) {
        return AcademicGrade.builder()
                .name(request.getName())
                .build();
    }
}