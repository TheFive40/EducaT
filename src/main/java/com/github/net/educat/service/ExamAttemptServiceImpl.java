package com.github.net.educat.service;

import com.github.net.educat.application.ExamAttemptService;
import com.github.net.educat.domain.*;
import com.github.net.educat.dto.request.ExamAttemptRequest;
import com.github.net.educat.dto.response.ExamAttemptResponse;
import com.github.net.educat.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.time.LocalDateTime;
import java.util.*;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamAttemptServiceImpl implements ExamAttemptService {
    private final ExamAttemptRepository attemptRepository;
    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final StudentRepository studentRepository;
    private final ObjectMapper objectMapper;

    @Override
    public ExamAttemptResponse startAttempt(Integer examId, Integer studentId) {
        Exam exam = examRepository.findById(examId)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + examId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + studentId));
        LocalDateTime now = LocalDateTime.now();
        if (exam.getOpenAt() != null && now.isBefore(exam.getOpenAt())) {
            throw new IllegalStateException("El examen aún no está abierto. Abre el " + exam.getOpenAt().toString());
        }
        if (exam.getCloseAt() != null && now.isAfter(exam.getCloseAt())) {
            throw new IllegalStateException("El examen ya ha cerrado. Cerró el " + exam.getCloseAt().toString());
        }
        int previousAttempts = attemptRepository.findByExam_IdAndStudent_Id(examId, studentId).size();
        int maxAttempts = exam.getMaxAttempts() != null ? exam.getMaxAttempts() : 1;
        if (previousAttempts >= maxAttempts) {
            throw new IllegalStateException("Has alcanzado el número máximo de intentos (" + maxAttempts + ").");
        }
        Optional<ExamAttempt> existing = attemptRepository.findByExam_IdAndStudent_IdAndStatus(examId, studentId, "in_progress");
        if (existing.isPresent()) {
            return toResponse(existing.get());
        }
        ExamAttempt attempt = ExamAttempt.builder()
                .exam(exam)
                .student(student)
                .status("in_progress")
                .answersJson("{}")
                .build();
        return toResponse(attemptRepository.save(attempt));
    }

    @Override
    public ExamAttemptResponse submitAttempt(Integer attemptId, ExamAttemptRequest request) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        attempt.setAnswersJson(request.getAnswersJson());
        attempt.setSubmittedAt(LocalDateTime.now());
        attempt.setStatus("submitted");
        attempt = attemptRepository.save(attempt);
        return gradeAttempt(attempt.getId());
    }

    @Override
    @Transactional(readOnly = true)
    public ExamAttemptResponse findById(Integer id) {
        return attemptRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamAttemptResponse> findByExamId(Integer examId) {
        return attemptRepository.findByExam_Id(examId).stream().map(this::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamAttemptResponse> findByStudentId(Integer studentId) {
        return attemptRepository.findByStudent_Id(studentId).stream().map(this::toResponse).toList();
    }

    @Override
    public ExamAttemptResponse gradeAttempt(Integer attemptId) {
        ExamAttempt attempt = attemptRepository.findById(attemptId)
                .orElseThrow(() -> new EntityNotFoundException("Attempt not found: " + attemptId));
        Exam exam = attempt.getExam();
        List<ExamQuestion> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(exam.getId());
        Map<String, Object> results = new LinkedHashMap<>();
        double totalScore = 0.0;
        double totalPoints = 0.0;
        Map<String, Object> answers;
        try {
            answers = objectMapper.readValue(attempt.getAnswersJson() != null ? attempt.getAnswersJson() : "{}", Map.class);
        } catch (Exception e) {
            answers = new LinkedHashMap<>();
        }
        for (ExamQuestion q : questions) {
            double questionPoints = q.getPoints() != null ? q.getPoints() : 1.0;
            totalPoints += questionPoints;
            String qid = String.valueOf(q.getId());
            Object studentAnswer = answers.get(qid);
            boolean isCorrect = false;
            double earned = 0.0;
            try {
                if ("single_choice".equals(q.getQuestionType()) || "multiple_choice".equals(q.getQuestionType())) {
                    List<String> correctIds = objectMapper.readValue(q.getCorrectAnswerJson() != null ? q.getCorrectAnswerJson() : "[]", List.class);
                    if (studentAnswer instanceof List) {
                        List<String> sa = (List<String>) studentAnswer;
                        if ("single_choice".equals(q.getQuestionType())) {
                            isCorrect = sa.size() == 1 && correctIds.contains(sa.get(0));
                        } else {
                            isCorrect = new HashSet<>(sa).equals(new HashSet<>(correctIds));
                        }
                    } else if (studentAnswer instanceof String) {
                        isCorrect = correctIds.contains(studentAnswer);
                    }
                } else if ("true_false".equals(q.getQuestionType())) {
                    Boolean correct = objectMapper.readValue(q.getCorrectAnswerJson() != null ? q.getCorrectAnswerJson() : "false", Boolean.class);
                    isCorrect = correct != null && correct.equals(studentAnswer);
                } else {
                    isCorrect = studentAnswer != null && !String.valueOf(studentAnswer).trim().isEmpty();
                }
            } catch (Exception e) {}
            if (isCorrect) earned = questionPoints;
            totalScore += earned;
            Map<String, Object> qResult = new LinkedHashMap<>();
            qResult.put("correct", isCorrect);
            qResult.put("earned", earned);
            qResult.put("possible", questionPoints);
            qResult.put("feedback", q.getFeedback());
            results.put(qid, qResult);
        }
        double finalScore = totalPoints > 0 ? (totalScore / totalPoints) * getMaxScore(exam) : 0.0;
        attempt.setScore(finalScore);
        attempt.setStatus("graded");
        Map<String, Object> resultsMap = new LinkedHashMap<>();
        resultsMap.put("score", finalScore);
        resultsMap.put("totalPoints", totalPoints);
        resultsMap.put("earnedPoints", totalScore);
        resultsMap.put("questions", results);
        try {
            attempt.setAnswersJson(objectMapper.writeValueAsString(resultsMap));
        } catch (Exception e) {}
        return toResponse(attemptRepository.save(attempt));
    }

    private double getMaxScore(Exam exam) {
        try {
            Map<String, Object> settings = objectMapper.readValue(exam.getSettingsJson() != null ? exam.getSettingsJson() : "{}", Map.class);
            Object max = settings.get("maxScore");
            if (max instanceof Number) return ((Number) max).doubleValue();
        } catch (Exception e) {}
        return 10.0;
    }

    private ExamAttemptResponse toResponse(ExamAttempt a) {
        return ExamAttemptResponse.builder()
                .id(a.getId())
                .examId(a.getExam() != null ? a.getExam().getId() : null)
                .studentId(a.getStudent() != null ? a.getStudent().getId() : null)
                .studentName(a.getStudent() != null && a.getStudent().getUser() != null ? a.getStudent().getUser().getName() : null)
                .startedAt(a.getStartedAt())
                .submittedAt(a.getSubmittedAt())
                .score(a.getScore())
                .status(a.getStatus())
                .answersJson(a.getAnswersJson())
                .build();
    }
}
