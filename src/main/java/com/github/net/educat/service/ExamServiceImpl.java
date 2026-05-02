package com.github.net.educat.service;

import com.github.net.educat.application.ExamService;
import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Exam;
import com.github.net.educat.domain.ExamQuestion;
import com.github.net.educat.dto.request.ExamQuestionRequest;
import com.github.net.educat.dto.request.ExamRequest;
import com.github.net.educat.dto.response.ExamResponse;
import com.github.net.educat.mapper.ExamMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.ExamQuestionRepository;
import com.github.net.educat.repository.ExamRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ExamServiceImpl implements ExamService {
    private final ExamRepository examRepository;
    private final ExamQuestionRepository questionRepository;
    private final CourseRepository courseRepository;
    private final ExamMapper examMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> findAll() {
        return examRepository.findAll().stream()
                .map(e -> {
                    List<ExamQuestion> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(e.getId());
                    return examMapper.toResponse(e, questions);
                })
                .toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ExamResponse findById(Integer id) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + id));
        List<ExamQuestion> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(id);
        return examMapper.toResponse(exam, questions);
    }

    @Override
    public ExamResponse save(ExamRequest request) {
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Exam exam = examMapper.toEntity(request);
        exam.setCourse(course);
        Exam saved = examRepository.save(exam);
        saveQuestions(saved, request.getQuestions());
        List<ExamQuestion> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(saved.getId());
        return examMapper.toResponse(saved, questions);
    }

    @Override
    public ExamResponse update(Integer id, ExamRequest request) {
        Exam exam = examRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Exam not found: " + id));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        exam.setCourse(course);
        exam.setTitle(request.getTitle());
        exam.setExamDate(request.getExamDate());
        exam.setExamTime(request.getExamTime());
        exam.setDescription(request.getDescription());
        exam.setAccessKey(request.getAccessKey());
        exam.setConfigJson(request.getConfigJson());
        exam.setSettingsJson(request.getSettingsJson());
        exam.setOpenAt(examMapper.parseDateTime(request.getOpenAt()));
        exam.setCloseAt(examMapper.parseDateTime(request.getCloseAt()));
        exam.setMaxAttempts(request.getMaxAttempts());
        Exam saved = examRepository.save(exam);
        saveQuestions(saved, request.getQuestions());
        List<ExamQuestion> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(saved.getId());
        return examMapper.toResponse(saved, questions);
    }

    private void saveQuestions(Exam exam, List<ExamQuestionRequest> questionRequests) {
        if (questionRequests == null) return;
        questionRepository.deleteByExamId(exam.getId());
        for (ExamQuestionRequest r : questionRequests) {
            ExamQuestion q = examMapper.toQuestionEntity(r, exam);
            questionRepository.save(q);
        }
    }

    @Override
    public void delete(Integer id) {
        if (!examRepository.existsById(id)) throw new EntityNotFoundException("Exam not found: " + id);
        questionRepository.deleteByExamId(id);
        examRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ExamResponse> findByCourseId(Integer courseId) {
        return examRepository.findByCourseId(courseId).stream()
                .map(e -> {
                    List<ExamQuestion> questions = questionRepository.findByExamIdOrderByOrderIndexAsc(e.getId());
                    return examMapper.toResponse(e, questions);
                })
                .toList();
    }
}
