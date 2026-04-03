package com.educat.es.mapper;

import com.educat.es.domain.Exam;
import com.educat.es.dto.request.ExamRequest;
import com.educat.es.dto.response.ExamResponse;
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
