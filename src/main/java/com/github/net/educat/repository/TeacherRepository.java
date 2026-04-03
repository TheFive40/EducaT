package com.github.net.educat.repository;

import com.github.net.educat.domain.Teacher;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface TeacherRepository extends JpaRepository<Teacher, Integer> {
    Optional<Teacher> findByUserId(Integer userId);
}
