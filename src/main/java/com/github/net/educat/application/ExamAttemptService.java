package com.github.net.educat.application;

import com.github.net.educat.dto.request.ExamAttemptRequest;
import com.github.net.educat.dto.response.ExamAttemptResponse;
import java.util.List;

public interface ExamAttemptService {
    ExamAttemptResponse startAttempt(Integer examId, Integer studentId);
    ExamAttemptResponse submitAttempt(Integer attemptId, ExamAttemptRequest request);
    ExamAttemptResponse findById(Integer id);
    List<ExamAttemptResponse> findByExamId(Integer examId);
    List<ExamAttemptResponse> findByStudentId(Integer studentId);
    ExamAttemptResponse gradeAttempt(Integer attemptId);
}
