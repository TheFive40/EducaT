package com.optical.net.educat.repository;

import com.optical.net.educat.domain.Student;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;
import java.util.Optional;

@Repository
public interface StudentRepository extends JpaRepository<Student, Integer> {
    Optional<Student> findByStudentCode(String studentCode);
    Optional<Student> findByUserId(Integer userId);
}
