package com.github.net.educat.repository;

import com.github.net.educat.domain.ExamQuestion;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamQuestionRepository extends JpaRepository<ExamQuestion, Integer> {
    List<ExamQuestion> findByExamIdOrderByOrderIndexAsc(Integer examId);
    void deleteByExamId(Integer examId);
}
