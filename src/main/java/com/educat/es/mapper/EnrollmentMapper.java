package com.educat.es.mapper;

import com.educat.es.domain.Enrollment;
import com.educat.es.dto.request.EnrollmentRequest;
import com.educat.es.dto.response.EnrollmentResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class EnrollmentMapper {
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;

    public EnrollmentResponse toResponse(Enrollment enrollment) {
        return EnrollmentResponse.builder()
                .id(enrollment.getId())
                .student(enrollment.getStudent() != null ? studentMapper.toResponse(enrollment.getStudent()) : null)
                .course(enrollment.getCourse() != null ? courseMapper.toResponse(enrollment.getCourse()) : null)
                .enrollmentDate(enrollment.getEnrollmentDate())
                .build();
    }
    public Enrollment toEntity(EnrollmentRequest request) {
        return Enrollment.builder()
                .enrollmentDate(request.getEnrollmentDate())
                .build();
    }
}
