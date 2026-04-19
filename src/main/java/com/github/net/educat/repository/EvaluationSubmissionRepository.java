package com.github.net.educat.repository;

import com.github.net.educat.domain.EvaluationSubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface EvaluationSubmissionRepository extends JpaRepository<EvaluationSubmission, Integer>, JpaSpecificationExecutor<EvaluationSubmission> {
    Optional<EvaluationSubmission> findByStudentIdAndCourseIdAndEvaluationType(Integer studentId, Integer courseId, String evaluationType);
}

