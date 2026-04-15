package com.github.net.educat.repository;

import com.github.net.educat.domain.Course;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface CourseRepository extends JpaRepository<Course, Integer> {
    List<Course> findByTeacherId(Integer teacherId);
    List<Course> findByTeacherIsNull();
    Optional<Course> findByCourseCodeIgnoreCase(String courseCode);
    boolean existsByCourseCodeIgnoreCase(String courseCode);
}
