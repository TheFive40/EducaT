package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.EvaluationSubmissionService;
import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.EvaluationSubmission;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.EvaluationSubmissionRequest;
import com.github.net.educat.dto.response.EvaluationSubmissionResponse;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.EvaluationSubmissionRepository;
import com.github.net.educat.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.Collections;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
@Transactional
public class EvaluationSubmissionServiceImpl implements EvaluationSubmissionService {
    private static final Set<String> VALID_EVALUATION_TYPES = Set.of("EVAL", "AUTOEVAL");

    private final EvaluationSubmissionRepository evaluationSubmissionRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final StudentMapper studentMapper;
    private final CourseMapper courseMapper;
    private final ObjectMapper objectMapper;

    @Override
    public EvaluationSubmissionResponse upsert(EvaluationSubmissionRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));

        String evalType = normalizeEvaluationType(request.getEvaluationType());

        EvaluationSubmission submission = evaluationSubmissionRepository
                .findByStudentIdAndCourseIdAndEvaluationType(student.getId(), course.getId(), evalType)
                .orElseGet(() -> EvaluationSubmission.builder()
                        .student(student)
                        .course(course)
                        .evaluationType(evalType)
                        .submitted(false)
                        .build());

        boolean shouldSubmit = request.getSubmitted() == null || Boolean.TRUE.equals(request.getSubmitted());
        if (!shouldSubmit && Boolean.TRUE.equals(submission.getSubmitted())) {
            throw new IllegalArgumentException("Cannot revert an already submitted evaluation to draft");
        }

        submission.setAnswersJson(writeMap(request.getAnswers()));
        submission.setSubmitted(shouldSubmit);
        submission.setSubmittedAt(shouldSubmit ? LocalDateTime.now() : null);

        return toResponse(evaluationSubmissionRepository.save(submission));
    }

    @Override
    @Transactional(readOnly = true)
    public EvaluationSubmissionResponse findById(Integer id) {
        return evaluationSubmissionRepository.findById(id)
                .map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Evaluation submission not found: " + id));
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvaluationSubmissionResponse> findByFilters(Integer studentId, Integer courseId, String evaluationType, Boolean submitted, Pageable pageable) {
        Specification<EvaluationSubmission> spec = (root, query, cb) -> cb.conjunction();

        if (studentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("student").get("id"), studentId));
        }
        if (courseId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("course").get("id"), courseId));
        }
        if (evaluationType != null && !evaluationType.isBlank()) {
            String normalized = normalizeEvaluationType(evaluationType);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("evaluationType"), normalized));
        }
        if (submitted != null) {
            if (submitted) {
                spec = spec.and((root, query, cb) -> cb.or(
                        cb.isTrue(root.get("submitted")),
                        cb.and(cb.isNull(root.get("submitted")), cb.isNotNull(root.get("submittedAt")))
                ));
            } else {
                spec = spec.and((root, query, cb) -> cb.or(
                        cb.isFalse(root.get("submitted")),
                        cb.and(cb.isNull(root.get("submitted")), cb.isNull(root.get("submittedAt")))
                ));
            }
        }

        return evaluationSubmissionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public void delete(Integer id) {
        if (!evaluationSubmissionRepository.existsById(id)) {
            throw new EntityNotFoundException("Evaluation submission not found: " + id);
        }
        evaluationSubmissionRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvaluationSubmissionResponse> findMySubmissions(Integer userId, Integer courseId, String evaluationType, Boolean submitted, Pageable pageable) {
        // Get student for this user
        Student student = studentRepository.findByUserId(userId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found for user: " + userId));
        
        return findByFilters(student.getId(), courseId, evaluationType, submitted, pageable);
    }

    @Override
    @Transactional(readOnly = true)
    public Page<EvaluationSubmissionResponse> findTeacherSubmissions(Integer teacherId, Integer courseId, Integer studentId, String evaluationType, Boolean submitted, Pageable pageable) {
        Specification<EvaluationSubmission> spec = (root, query, cb) -> {
            // Filter by course if specified
            if (courseId != null) {
                return cb.equal(root.get("course").get("id"), courseId);
            }
            return cb.conjunction();
        };

        // Additional filters
        if (studentId != null) {
            spec = spec.and((root, query, cb) -> cb.equal(root.get("student").get("id"), studentId));
        }
        if (evaluationType != null && !evaluationType.isBlank()) {
            String normalized = normalizeEvaluationType(evaluationType);
            spec = spec.and((root, query, cb) -> cb.equal(root.get("evaluationType"), normalized));
        }
        if (submitted != null) {
            if (submitted) {
                spec = spec.and((root, query, cb) -> cb.or(
                        cb.isTrue(root.get("submitted")),
                        cb.and(cb.isNull(root.get("submitted")), cb.isNotNull(root.get("submittedAt")))
                ));
            } else {
                spec = spec.and((root, query, cb) -> cb.or(
                        cb.isFalse(root.get("submitted")),
                        cb.and(cb.isNull(root.get("submitted")), cb.isNull(root.get("submittedAt")))
                ));
            }
        }

        return evaluationSubmissionRepository.findAll(spec, pageable).map(this::toResponse);
    }

    @Override
    public EvaluationSubmissionResponse gradeSubmission(Integer submissionId, Integer teacherId, Double grade, String feedback) {
        EvaluationSubmission submission = evaluationSubmissionRepository.findById(submissionId)
                .orElseThrow(() -> new EntityNotFoundException("Evaluation submission not found: " + submissionId));
        
        // TODO: Validate that teacher owns the course
        submission.setGrade(grade);
        submission.setFeedback(feedback);
        submission.setGradedAt(LocalDateTime.now());
        
        return toResponse(evaluationSubmissionRepository.save(submission));
    }

    @Override
    @Transactional(readOnly = true)
    public Integer getStudentIdByUserId(Integer userId) {
        return studentRepository.findByUserId(userId)
                .map(Student::getId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found for user: " + userId));
    }

    private String normalizeEvaluationType(String evaluationType) {
        String normalized = evaluationType == null ? "" : evaluationType.trim().toUpperCase(Locale.ROOT);
        if (!VALID_EVALUATION_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid evaluation type: " + evaluationType);
        }
        return normalized;
    }

    private EvaluationSubmissionResponse toResponse(EvaluationSubmission submission) {
        Boolean submitted = submission.getSubmitted();
        if (submitted == null) {
            submitted = submission.getSubmittedAt() != null;
        }
        return EvaluationSubmissionResponse.builder()
                .id(submission.getId())
                .student(submission.getStudent() != null ? studentMapper.toResponse(submission.getStudent()) : null)
                .course(submission.getCourse() != null ? courseMapper.toResponse(submission.getCourse()) : null)
                .evaluationType(submission.getEvaluationType())
                .answers(readMap(submission.getAnswersJson()))
                .submitted(submitted)
                .submittedAt(submission.getSubmittedAt())
                .grade(submission.getGrade())
                .feedback(submission.getFeedback())
                .gradedAt(submission.getGradedAt())
                .build();
    }

    private String writeMap(Map<String, Object> payload) {
        try {
            return objectMapper.writeValueAsString(payload == null ? Map.of() : payload);
        } catch (Exception ex) {
            throw new IllegalArgumentException("Cannot serialize evaluation answers");
        }
    }

    private Map<String, Object> readMap(String rawJson) {
        try {
            if (rawJson == null || rawJson.isBlank()) return Map.of();
            return objectMapper.readValue(rawJson, new TypeReference<>() {});
        } catch (Exception ex) {
            return Collections.emptyMap();
        }
    }
}
