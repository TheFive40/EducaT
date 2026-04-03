package com.github.net.educat.repository;

import com.github.net.educat.domain.Activity;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ActivityRepository extends JpaRepository<Activity, Integer> {
    List<Activity> findByCourseId(Integer courseId);
}
