package com.github.net.educat.service;

import com.github.net.educat.domain.ActivitySubmission;
import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Grade;
import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.Activity;
import com.github.net.educat.repository.ActivitySubmissionRepository;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.GradeRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.dto.request.GradeRequest;
import com.github.net.educat.dto.response.GradeResponse;
import com.github.net.educat.mapper.ActivitySubmissionMapper;
import com.github.net.educat.mapper.GradeMapper;
import com.github.net.educat.application.GradeService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GradeServiceImpl implements GradeService {
    private final GradeRepository gradeRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final ActivitySubmissionRepository activitySubmissionRepository;
    private final GradeMapper gradeMapper;
    private final ActivitySubmissionMapper submissionMapper;

    @Override @Transactional(readOnly = true)
    public List<GradeResponse> findAll() {
        return gradeRepository.findAll().stream().map(gradeMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public GradeResponse findById(Integer id) {
        return gradeRepository.findById(id).map(gradeMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Grade not found: " + id));
    }
    @Override
    public GradeResponse save(GradeRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));

        Grade grade;
        if (request.getActivityId() != null) {
            grade = gradeRepository.findByStudentIdAndActivityId(request.getStudentId(), request.getActivityId())
                    .orElse(null);
            if (grade != null) {
                grade.setGrade(request.getGrade());
                grade.setDescription(request.getDescription());
                grade.setCourse(course);
                grade.setSourceUnitId(request.getSourceUnitId());
                grade.setSource(request.getSource());
                Grade saved = gradeRepository.save(grade);
                syncGradeToActivitySubmission(saved, request.getStudentId());
                replicateGradeToGroupMembers(saved, request.getStudentId());
                return gradeMapper.toResponse(saved);
            }
        }

        grade = gradeMapper.toEntity(request);
        grade.setStudent(student);
        grade.setCourse(course);
        grade.setActivityId(request.getActivityId());
        grade.setSourceUnitId(request.getSourceUnitId());
        grade.setSource(request.getSource());
        Grade saved = gradeRepository.save(grade);
        syncGradeToActivitySubmission(saved, request.getStudentId());
        replicateGradeToGroupMembers(saved, request.getStudentId());
        return gradeMapper.toResponse(saved);
    }
    @Override
    public GradeResponse update(Integer id, GradeRequest request) {
        Grade grade = gradeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Grade not found: " + id));
        grade.setGrade(request.getGrade());
        grade.setDescription(request.getDescription());
        grade.setActivityId(request.getActivityId());
        grade.setSourceUnitId(request.getSourceUnitId());
        grade.setSource(request.getSource());
        Grade saved = gradeRepository.save(grade);
        syncGradeToActivitySubmission(saved, request.getStudentId());
        replicateGradeToGroupMembers(saved, request.getStudentId());
        return gradeMapper.toResponse(saved);
    }
    @Override
    public void delete(Integer id) {
        Grade grade = gradeRepository.findById(id).orElse(null);
        if (grade != null) {
            Integer studentId = grade.getStudent() != null ? grade.getStudent().getId() : null;
            gradeRepository.deleteById(id);
            clearGradeFromActivitySubmission(grade, studentId);
        } else {
            throw new EntityNotFoundException("Grade not found: " + id);
        }
    }
    @Override @Transactional(readOnly = true)
    public List<GradeResponse> findByStudentId(Integer studentId) {
        return gradeRepository.findByStudentId(studentId).stream().map(gradeMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public List<GradeResponse> findByCourseId(Integer courseId) {
        return gradeRepository.findByCourseId(courseId).stream().map(gradeMapper::toResponse).toList();
    }

    private void syncGradeToActivitySubmission(Grade grade, Integer studentId) {
        if (grade.getActivityId() == null || studentId == null) return;
        activitySubmissionRepository.findByActivityIdAndStudentId(grade.getActivityId(), studentId)
                .ifPresent(sub -> {
                    sub.setGrade(grade.getGrade());
                    sub.setFeedback(grade.getDescription());
                    sub.setGradedAt(LocalDateTime.now());
                    activitySubmissionRepository.save(sub);
                });
    }

    private void clearGradeFromActivitySubmission(Grade grade, Integer studentId) {
        if (grade.getActivityId() == null || studentId == null) return;
        activitySubmissionRepository.findByActivityIdAndStudentId(grade.getActivityId(), studentId)
                .ifPresent(sub -> {
                    sub.setGrade(null);
                    sub.setFeedback(null);
                    sub.setGradedAt(null);
                    activitySubmissionRepository.save(sub);
                });
    }

    private void replicateGradeToGroupMembers(Grade grade, Integer studentId) {
        if (grade.getActivityId() == null || studentId == null) return;
        ActivitySubmission submission = activitySubmissionRepository.findByActivityIdAndStudentId(grade.getActivityId(), studentId).orElse(null);
        if (submission == null) return;
        Activity activity = submission.getActivity();
        if (activity == null || !Boolean.TRUE.equals(activity.getIsGroupWork())) return;

        List<Integer> groupMembers = submissionMapper.readIntList(submission.getGroupMembersJson());
        if (groupMembers == null || groupMembers.isEmpty()) return;

        for (Integer memberId : groupMembers) {
            if (memberId == null) continue;
            Student member = studentRepository.findById(memberId).orElse(null);
            if (member == null) continue;

            Grade memberGrade = gradeRepository.findByStudentIdAndActivityId(memberId, grade.getActivityId()).orElse(null);
            if (memberGrade != null) {
                memberGrade.setGrade(grade.getGrade());
                memberGrade.setDescription(grade.getDescription());
                memberGrade.setCourse(grade.getCourse());
                memberGrade.setSourceUnitId(grade.getSourceUnitId());
                memberGrade.setSource(grade.getSource());
                gradeRepository.save(memberGrade);
            } else {
                Grade newGrade = Grade.builder()
                        .student(member)
                        .course(grade.getCourse())
                        .activityId(grade.getActivityId())
                        .sourceUnitId(grade.getSourceUnitId())
                        .source(grade.getSource())
                        .grade(grade.getGrade())
                        .description(grade.getDescription())
                        .build();
                gradeRepository.save(newGrade);
            }

            activitySubmissionRepository.findByActivityIdAndStudentId(grade.getActivityId(), memberId)
                    .ifPresent(memSub -> {
                        memSub.setGrade(grade.getGrade());
                        memSub.setFeedback(grade.getDescription());
                        memSub.setGradedAt(LocalDateTime.now());
                        activitySubmissionRepository.save(memSub);
                    });
        }
    }
}
