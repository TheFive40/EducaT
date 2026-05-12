package com.github.net.educat.repository;

import com.github.net.educat.domain.AcademicArticle;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface AcademicArticleRepository extends JpaRepository<AcademicArticle, Integer> {
}
