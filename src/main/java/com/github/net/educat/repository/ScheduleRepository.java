package com.github.net.educat.repository;

import com.github.net.educat.domain.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {
    List<Schedule> findByCourseId(Integer courseId);

    @Query("""
            SELECT DISTINCT s
            FROM Schedule s
            JOIN Enrollment e ON e.course.id = s.course.id
            WHERE e.student.id = :studentId
            """)
    List<Schedule> findByStudentId(@Param("studentId") Integer studentId);
}
