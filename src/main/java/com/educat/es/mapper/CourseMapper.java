package com.educat.es.mapper;

import com.educat.es.domain.Course;
import com.educat.es.dto.request.CourseRequest;
import com.educat.es.dto.response.CourseResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class CourseMapper {
    private final TeacherMapper teacherMapper;

    public CourseResponse toResponse(Course course) {
        return CourseResponse.builder()
                .id(course.getId())
                .name(course.getName())
                .description(course.getDescription())
                .teacher(course.getTeacher() != null ? teacherMapper.toResponse(course.getTeacher()) : null)
                .build();
    }
    public Course toEntity(CourseRequest request) {
        return Course.builder()
                .name(request.getName())
                .description(request.getDescription())
                .build();
    }
}
