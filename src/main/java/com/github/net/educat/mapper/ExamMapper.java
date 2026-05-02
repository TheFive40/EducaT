package com.github.net.educat.mapper;

import com.github.net.educat.domain.Exam;
import com.github.net.educat.domain.ExamQuestion;
import com.github.net.educat.dto.request.ExamQuestionRequest;
import com.github.net.educat.dto.request.ExamRequest;
import com.github.net.educat.dto.response.ExamQuestionResponse;
import com.github.net.educat.dto.response.ExamResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.time.format.DateTimeParseException;
import java.util.List;

@Component
@RequiredArgsConstructor
public class ExamMapper {
    private final CourseMapper courseMapper;

    public ExamResponse toResponse(Exam exam, List<ExamQuestion> questions) {
        return ExamResponse.builder()
                .id(exam.getId())
                .course(exam.getCourse() != null ? courseMapper.toResponse(exam.getCourse()) : null)
                .title(exam.getTitle())
                .examDate(exam.getExamDate())
                .examTime(exam.getExamTime())
                .description(exam.getDescription())
                .accessKey(exam.getAccessKey())
                .configJson(exam.getConfigJson())
                .settingsJson(exam.getSettingsJson())
                .openAt(exam.getOpenAt())
                .closeAt(exam.getCloseAt())
                .maxAttempts(exam.getMaxAttempts())
                .createdAt(exam.getCreatedAt())
                .updatedAt(exam.getUpdatedAt())
                .questions(questions != null ? questions.stream().map(this::toQuestionResponse).toList() : null)
                .build();
    }

    public ExamResponse toResponse(Exam exam) {
        return toResponse(exam, null);
    }

    public Exam toEntity(ExamRequest request) {
        return Exam.builder()
                .title(request.getTitle())
                .examDate(request.getExamDate())
                .examTime(request.getExamTime())
                .description(request.getDescription())
                .accessKey(request.getAccessKey())
                .configJson(request.getConfigJson())
                .settingsJson(request.getSettingsJson())
                .openAt(parseDateTime(request.getOpenAt()))
                .closeAt(parseDateTime(request.getCloseAt()))
                .maxAttempts(request.getMaxAttempts())
                .build();
    }

    public LocalDateTime parseDateTime(String value) {
        if (value == null || value.isBlank()) return null;
        try {
            return LocalDateTime.parse(value, DateTimeFormatter.ISO_LOCAL_DATE_TIME);
        } catch (DateTimeParseException e) {
            try {
                return LocalDateTime.parse(value, DateTimeFormatter.ofPattern("yyyy-MM-dd HH:mm"));
            } catch (DateTimeParseException e2) {
                return null;
            }
        }
    }

    public ExamQuestionResponse toQuestionResponse(ExamQuestion q) {
        return ExamQuestionResponse.builder()
                .id(q.getId())
                .orderIndex(q.getOrderIndex())
                .questionType(q.getQuestionType())
                .questionText(q.getQuestionText())
                .optionsJson(q.getOptionsJson())
                .correctAnswerJson(q.getCorrectAnswerJson())
                .feedback(q.getFeedback())
                .points(q.getPoints())
                .timeLimitSeconds(q.getTimeLimitSeconds())
                .build();
    }

    public ExamQuestion toQuestionEntity(ExamQuestionRequest r, Exam exam) {
        return ExamQuestion.builder()
                .exam(exam)
                .orderIndex(r.getOrderIndex())
                .questionType(r.getQuestionType())
                .questionText(r.getQuestionText())
                .optionsJson(r.getOptionsJson())
                .correctAnswerJson(r.getCorrectAnswerJson())
                .feedback(r.getFeedback())
                .points(r.getPoints() != null ? r.getPoints() : 1.0)
                .timeLimitSeconds(r.getTimeLimitSeconds())
                .build();
    }
}
