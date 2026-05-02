package com.github.net.educat.mapper;

import com.github.net.educat.domain.AcademicLevel;
import com.github.net.educat.dto.request.AcademicLevelRequest;
import com.github.net.educat.dto.response.AcademicLevelResponse;
import org.springframework.stereotype.Component;

@Component
public class AcademicLevelMapper {
    public AcademicLevelResponse toResponse(AcademicLevel level) {
        return AcademicLevelResponse.builder()
                .id(level.getId())
                .name(level.getName())
                .description(level.getDescription())
                .build();
    }

    public AcademicLevel toEntity(AcademicLevelRequest request) {
        return AcademicLevel.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
    }
}