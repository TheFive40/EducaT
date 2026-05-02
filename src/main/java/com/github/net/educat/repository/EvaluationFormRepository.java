package com.github.net.educat.repository;

import com.github.net.educat.domain.EvaluationForm;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface EvaluationFormRepository extends JpaRepository<EvaluationForm, Integer> {
    List<EvaluationForm> findByType(String type);
}