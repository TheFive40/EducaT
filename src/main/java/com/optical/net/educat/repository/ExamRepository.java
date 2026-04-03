package com.optical.net.educat.repository;

import com.optical.net.educat.domain.Exam;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ExamRepository extends JpaRepository<Exam, Integer> {
    List<Exam> findByCourseId(Integer courseId);
}
