package com.github.net.educat.mapper;

import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.StudentRequest;
import com.github.net.educat.dto.response.StudentResponse;
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
