package com.educat.es.mapper;

import com.educat.es.domain.StudentWellbeing;
import com.educat.es.dto.request.StudentWellbeingRequest;
import com.educat.es.dto.response.StudentWellbeingResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StudentWellbeingMapper {
    private final StudentMapper studentMapper;

    public StudentWellbeingResponse toResponse(StudentWellbeing wellbeing) {
        return StudentWellbeingResponse.builder()
                .id(wellbeing.getId())
                .student(wellbeing.getStudent() != null ? studentMapper.toResponse(wellbeing.getStudent()) : null)
                .type(wellbeing.getType())
                .message(wellbeing.getMessage())
                .createdAt(wellbeing.getCreatedAt())
                .build();
    }
    public StudentWellbeing toEntity(StudentWellbeingRequest request) {
        return StudentWellbeing.builder()
                .type(request.getType())
                .message(request.getMessage())
                .build();
    }
}
