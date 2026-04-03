package com.educat.es.mapper;

import com.educat.es.domain.Attendance;
import com.educat.es.dto.request.AttendanceRequest;
import com.educat.es.dto.response.AttendanceResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class AttendanceMapper {
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;

    public AttendanceResponse toResponse(Attendance attendance) {
        return AttendanceResponse.builder()
                .id(attendance.getId())
                .student(attendance.getStudent() != null ? studentMapper.toResponse(attendance.getStudent()) : null)
                .course(attendance.getCourse() != null ? courseMapper.toResponse(attendance.getCourse()) : null)
                .date(attendance.getDate())
                .present(attendance.getPresent())
                .build();
    }
    public Attendance toEntity(AttendanceRequest request) {
        return Attendance.builder()
                .date(request.getDate())
                .present(request.getPresent())
                .build();
    }
}
