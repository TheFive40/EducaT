package com.educat.es.repository;

import com.educat.es.domain.Attendance;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.time.LocalDate;
import java.util.List;

@Repository
public interface AttendanceRepository extends JpaRepository<Attendance, Integer> {
    List<Attendance> findByStudentId(Integer studentId);
    List<Attendance> findByCourseId(Integer courseId);
    List<Attendance> findByStudentIdAndCourseId(Integer studentId, Integer courseId);
    List<Attendance> findByCourseIdAndDate(Integer courseId, LocalDate date);
}
