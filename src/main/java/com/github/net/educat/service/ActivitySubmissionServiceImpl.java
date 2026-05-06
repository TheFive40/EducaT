package com.github.net.educat.service;

import com.github.net.educat.application.ActivitySubmissionService;
import com.github.net.educat.domain.Activity;
import com.github.net.educat.domain.ActivitySubmission;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.ActivitySubmissionRequest;
import com.github.net.educat.dto.response.ActivitySubmissionResponse;
import com.github.net.educat.mapper.ActivitySubmissionMapper;
import com.github.net.educat.domain.Grade;
import com.github.net.educat.repository.ActivityRepository;
import com.github.net.educat.repository.ActivitySubmissionRepository;
import com.github.net.educat.repository.GradeRepository;
import com.github.net.educat.repository.StudentRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.Optional;

@Service
@RequiredArgsConstructor
@Transactional
public class ActivitySubmissionServiceImpl implements ActivitySubmissionService {
    private final ActivitySubmissionRepository submissionRepository;
    private final ActivityRepository activityRepository;
    private final StudentRepository studentRepository;
    private final ActivitySubmissionMapper submissionMapper;
    private final GradeRepository gradeRepository;

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
        ActivitySubmission saved = submissionRepository.save(submission);

        // Si es trabajo en grupo, crear entregas para los miembros del grupo
        List<Integer> groupMembers = request.getGroupMembers() != null ? request.getGroupMembers() : Collections.emptyList();
        if (Boolean.TRUE.equals(activity.getIsGroupWork()) && !groupMembers.isEmpty()) {
            for (Integer memberId : groupMembers) {
                if (memberId == null || memberId.equals(request.getStudentId())) continue;
                Optional<ActivitySubmission> existing = submissionRepository.findByActivityIdAndStudentId(activity.getId(), memberId);
                if (existing.isPresent()) {
                    ActivitySubmission memSub = existing.get();
                    memSub.setComment(request.getComment());
                    memSub.setFilesJson(submission.getFilesJson());
                    memSub.setIsLate(submission.getIsLate());
                    memSub.setSubmittedAt(LocalDateTime.now());
                    memSub.setGroupMembersJson(submission.getGroupMembersJson());
                    submissionRepository.save(memSub);
                } else {
                    Student member = studentRepository.findById(memberId).orElse(null);
                    if (member != null) {
                        ActivitySubmission memSub = ActivitySubmission.builder()
                                .activity(activity)
                                .student(member)
                                .comment(request.getComment())
                                .filesJson(submission.getFilesJson())
                                .isLate(submission.getIsLate())
                                .submittedAt(LocalDateTime.now())
                                .groupMembersJson(submission.getGroupMembersJson())
                                .build();
                        submissionRepository.save(memSub);
                    }
                }
            }
        }

        return submissionMapper.toResponse(saved);
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
        submission.setGroupMembersJson(submissionMapper.writeIntList(request.getGroupMembers()));
        ActivitySubmission saved = submissionRepository.save(submission);

        // Actualizar entregas de grupo si aplica
        List<Integer> groupMembers = request.getGroupMembers() != null ? request.getGroupMembers() : Collections.emptyList();
        if (Boolean.TRUE.equals(activity.getIsGroupWork()) && !groupMembers.isEmpty()) {
            for (Integer memberId : groupMembers) {
                if (memberId == null || memberId.equals(request.getStudentId())) continue;
                Optional<ActivitySubmission> existing = submissionRepository.findByActivityIdAndStudentId(activity.getId(), memberId);
                if (existing.isPresent()) {
                    ActivitySubmission memSub = existing.get();
                    memSub.setComment(request.getComment());
                    memSub.setFilesJson(submission.getFilesJson());
                    memSub.setIsLate(submission.getIsLate());
                    memSub.setSubmittedAt(LocalDateTime.now());
                    memSub.setGroupMembersJson(submission.getGroupMembersJson());
                    submissionRepository.save(memSub);
                } else {
                    Student member = studentRepository.findById(memberId).orElse(null);
                    if (member != null) {
                        ActivitySubmission memSub = ActivitySubmission.builder()
                                .activity(activity)
                                .student(member)
                                .comment(request.getComment())
                                .filesJson(submission.getFilesJson())
                                .isLate(submission.getIsLate())
                                .submittedAt(LocalDateTime.now())
                                .groupMembersJson(submission.getGroupMembersJson())
                                .build();
                        submissionRepository.save(memSub);
                    }
                }
            }
        }

        return submissionMapper.toResponse(saved);
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
        ActivitySubmission saved = submissionRepository.save(submission);

        // Si es trabajo en grupo, calificar a todos los miembros
        Activity activity = submission.getActivity();
        List<Integer> groupMembers = submissionMapper.readIntList(submission.getGroupMembersJson());
        if (Boolean.TRUE.equals(activity != null ? activity.getIsGroupWork() : null) && !groupMembers.isEmpty()) {
            for (Integer memberId : groupMembers) {
                if (memberId == null) continue;
                Optional<ActivitySubmission> memOpt = submissionRepository.findByActivityIdAndStudentId(activity.getId(), memberId);
                if (memOpt.isPresent()) {
                    ActivitySubmission memSub = memOpt.get();
                    if (grade != null) {
                        memSub.setGrade(java.math.BigDecimal.valueOf(grade));
                    }
                    memSub.setFeedback(feedback);
                    memSub.setGradedAt(LocalDateTime.now());
                    submissionRepository.save(memSub);
                }
                // Replicar registro Grade al miembro
                Student member = studentRepository.findById(memberId).orElse(null);
                if (member != null && activity != null && activity.getCourse() != null) {
                    Grade memberGrade = gradeRepository.findByStudentIdAndActivityId(memberId, activity.getId()).orElse(null);
                    if (memberGrade != null) {
                        if (grade != null) {
                            memberGrade.setGrade(java.math.BigDecimal.valueOf(grade));
                        }
                        memberGrade.setDescription(feedback);
                        gradeRepository.save(memberGrade);
                    } else {
                        Grade newGrade = Grade.builder()
                                .student(member)
                                .course(activity.getCourse())
                                .activityId(activity.getId())
                                .grade(grade != null ? java.math.BigDecimal.valueOf(grade) : null)
                                .description(feedback)
                                .build();
                        gradeRepository.save(newGrade);
                    }
                }
            }
        }

        return submissionMapper.toResponse(saved);
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

    @Override
    public void leaveGroup(Integer activityId, Integer studentId) {
        ActivitySubmission submission = submissionRepository.findByActivityIdAndStudentId(activityId, studentId)
                .orElseThrow(() -> new EntityNotFoundException("Submission not found"));
        // Limpiar miembros de grupo para este estudiante y eliminar la entrega
        submissionRepository.delete(submission);
    }

    @Override
    public void deleteByActivityId(Integer activityId) {
        List<Grade> grades = gradeRepository.findByActivityId(activityId);
        if (!grades.isEmpty()) {
            gradeRepository.deleteAll(grades);
        }
        submissionRepository.deleteByActivity_Id(activityId);
    }
}
