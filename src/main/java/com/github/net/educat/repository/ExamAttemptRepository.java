package com.github.net.educat.repository;

import com.github.net.educat.domain.ExamAttempt;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExamAttemptRepository extends JpaRepository<ExamAttempt, Integer> {
    List<ExamAttempt> findByExam_Id(Integer examId);
    List<ExamAttempt> findByStudent_Id(Integer studentId);
    Optional<ExamAttempt> findByExam_IdAndStudent_IdAndStatus(Integer examId, Integer studentId, String status);
    List<ExamAttempt> findByExam_IdAndStudent_Id(Integer examId, Integer studentId);
}
