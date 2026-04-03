package com.github.net.educat.repository;

import com.github.net.educat.domain.StudentWellbeing;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface StudentWellbeingRepository extends JpaRepository<StudentWellbeing, Integer> {
    List<StudentWellbeing> findByStudentId(Integer studentId);
}
