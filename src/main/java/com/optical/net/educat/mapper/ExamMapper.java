package com.optical.net.educat.mapper;

import com.optical.net.educat.domain.Exam;
import com.optical.net.educat.dto.request.ExamRequest;
import com.optical.net.educat.dto.response.ExamResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ExamMapper {
    private final CourseMapper courseMapper;

    public ExamResponse toResponse(Exam exam) {
        return ExamResponse.builder()
                .id(exam.getId())
                .course(exam.getCourse() != null ? courseMapper.toResponse(exam.getCourse()) : null)
                .title(exam.getTitle())
                .examDate(exam.getExamDate())
                .build();
    }
    public Exam toEntity(ExamRequest request) {
        return Exam.builder()
                .title(request.getTitle())
                .examDate(request.getExamDate())
                .build();
    }
}
