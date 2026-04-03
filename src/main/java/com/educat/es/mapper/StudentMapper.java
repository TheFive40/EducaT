package com.educat.es.mapper;

import com.educat.es.domain.Student;
import com.educat.es.dto.request.StudentRequest;
import com.educat.es.dto.response.StudentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class StudentMapper {
    private final UserMapper userMapper;

    public StudentResponse toResponse(Student student) {
        return StudentResponse.builder()
                .id(student.getId())
                .user(student.getUser() != null ? userMapper.toResponse(student.getUser()) : null)
                .studentCode(student.getStudentCode())
                .build();
    }
    public Student toEntity(StudentRequest request) {
        return Student.builder()
                .studentCode(request.getStudentCode())
                .build();
    }
}
