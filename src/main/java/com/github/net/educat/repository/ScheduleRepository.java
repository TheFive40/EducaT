package com.github.net.educat.repository;

import com.github.net.educat.domain.Schedule;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ScheduleRepository extends JpaRepository<Schedule, Integer> {
    List<Schedule> findByCourseId(Integer courseId);
}
