package com.educat.es.repository;

import com.educat.es.domain.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Integer> {
    List<Grade> findByStudentId(Integer studentId);
    List<Grade> findByCourseId(Integer courseId);
    List<Grade> findByStudentIdAndCourseId(Integer studentId, Integer courseId);
}
