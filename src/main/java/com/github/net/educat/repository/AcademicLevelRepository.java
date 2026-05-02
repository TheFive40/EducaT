package com.github.net.educat.repository;

import com.github.net.educat.domain.AcademicLevel;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicLevelRepository extends JpaRepository<AcademicLevel, Integer> {
}