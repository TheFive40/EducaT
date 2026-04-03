package com.educat.es.mapper;

import com.educat.es.domain.Teacher;
import com.educat.es.dto.request.TeacherRequest;
import com.educat.es.dto.response.TeacherResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class TeacherMapper {
    private final UserMapper userMapper;

    public TeacherResponse toResponse(Teacher teacher) {
        return TeacherResponse.builder()
                .id(teacher.getId())
                .user(teacher.getUser() != null ? userMapper.toResponse(teacher.getUser()) : null)
                .specialization(teacher.getSpecialization())
                .build();
    }
    public Teacher toEntity(TeacherRequest request) {
        return Teacher.builder()
                .specialization(request.getSpecialization())
                .build();
    }
}
