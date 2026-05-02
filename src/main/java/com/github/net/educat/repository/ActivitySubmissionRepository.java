package com.github.net.educat.repository;

import com.github.net.educat.domain.ActivitySubmission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ActivitySubmissionRepository extends JpaRepository<ActivitySubmission, Integer> {
    List<ActivitySubmission> findByActivityId(Integer activityId);
    List<ActivitySubmission> findByStudentId(Integer studentId);
    Optional<ActivitySubmission> findByActivityIdAndStudentId(Integer activityId, Integer studentId);
}
