package com.github.net.educat.repository;

import com.github.net.educat.domain.AcademicGrade;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface AcademicGradeRepository extends JpaRepository<AcademicGrade, Integer> {
    List<AcademicGrade> findByLevelId(Integer levelId);
}