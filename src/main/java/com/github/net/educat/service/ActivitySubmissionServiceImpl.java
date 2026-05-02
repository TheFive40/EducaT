package com.github.net.educat.service;

import com.github.net.educat.application.ActivitySubmissionService;
import com.github.net.educat.domain.Activity;
import com.github.net.educat.domain.ActivitySubmission;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.ActivitySubmissionRequest;
import com.github.net.educat.dto.response.ActivitySubmissionResponse;
import com.github.net.educat.mapper.ActivitySubmissionMapper;
import com.github.net.educat.repository.ActivityRepository;
import com.github.net.educat.repository.ActivitySubmissionRepository;
import com.github.net.educat.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivitySubmissionServiceImpl implements ActivitySubmissionService {
    private final ActivitySubmissionRepository submissionRepository;
    private final ActivityRepository activityRepository;
    private final StudentRepository studentRepository;
    private final ActivitySubmissionMapper submissionMapper;

    @Override
    @Transactional(readOnly = true)
    public List<ActivitySubmissionResponse> findAll() {
        return submissionRepository.findAll().stream().map(submissionMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ActivitySubmissionResponse findById(Integer id) {
        return submissionRepository.findById(id).map(submissionMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + id));
    }

    @Override
    public ActivitySubmissionResponse save(ActivitySubmissionRequest request) {
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new EntityNotFoundException("Activity not found: " + request.getActivityId()));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));

        ActivitySubmission submission = submissionMapper.toEntity(request);
        submission.setActivity(activity);
        submission.setStudent(student);
        submission.setSubmittedAt(LocalDateTime.now());
        return submissionMapper.toResponse(submissionRepository.save(submission));
    }

    @Override
    public ActivitySubmissionResponse update(Integer id, ActivitySubmissionRequest request) {
        ActivitySubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + id));
        Activity activity = activityRepository.findById(request.getActivityId())
                .orElseThrow(() -> new EntityNotFoundException("Activity not found: " + request.getActivityId()));
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));

        submission.setActivity(activity);
        submission.setStudent(student);
        submission.setComment(request.getComment());
        submission.setFilesJson(submissionMapper.writeList(request.getFiles()));
        submission.setIsLate(request.getIsLate());
        submission.setSubmittedAt(LocalDateTime.now());
        return submissionMapper.toResponse(submissionRepository.save(submission));
    }

    @Override
    public ActivitySubmissionResponse grade(Integer id, Double grade, String feedback) {
        ActivitySubmission submission = submissionRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found: " + id));
        if (grade != null) {
            submission.setGrade(java.math.BigDecimal.valueOf(grade));
        }
        submission.setFeedback(feedback);
        submission.setGradedAt(LocalDateTime.now());
        return submissionMapper.toResponse(submissionRepository.save(submission));
    }

    @Override
    public void delete(Integer id) {
        if (!submissionRepository.existsById(id)) throw new EntityNotFoundException("Submission not found: " + id);
        submissionRepository.deleteById(id);
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivitySubmissionResponse> findByActivityId(Integer activityId) {
        return submissionRepository.findByActivityId(activityId).stream().map(submissionMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public List<ActivitySubmissionResponse> findByStudentId(Integer studentId) {
        return submissionRepository.findByStudentId(studentId).stream().map(submissionMapper::toResponse).toList();
    }

    @Override
    @Transactional(readOnly = true)
    public ActivitySubmissionResponse findByActivityIdAndStudentId(Integer activityId, Integer studentId) {
        return submissionRepository.findByActivityIdAndStudentId(activityId, studentId)
                .map(submissionMapper::toResponse)
                .orElse(null);
    }
}
