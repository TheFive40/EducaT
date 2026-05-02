package com.github.net.educat.repository;

import com.github.net.educat.domain.CourseUnit;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface CourseUnitRepository extends JpaRepository<CourseUnit, Integer> {
    List<CourseUnit> findByCourseIdOrderByIdAsc(Integer courseId);
}