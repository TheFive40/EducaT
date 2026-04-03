package com.optical.net.educat.repository;

import com.optical.net.educat.domain.Grade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface GradeRepository extends JpaRepository<Grade, Integer> {
    List<Grade> findByStudentId(Integer studentId);
    List<Grade> findByCourseId(Integer courseId);
    List<Grade> findByStudentIdAndCourseId(Integer studentId, Integer courseId);
}
