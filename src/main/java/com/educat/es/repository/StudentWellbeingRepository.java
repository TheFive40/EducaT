package com.educat.es.repository;

import com.educat.es.domain.StudentWellbeing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudentWellbeingRepository extends JpaRepository<StudentWellbeing, Integer> {
    List<StudentWellbeing> findByStudentId(Integer studentId);
}
