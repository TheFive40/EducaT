package com.github.net.educat.repository;

import com.github.net.educat.domain.WellbeingPublication;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface WellbeingPublicationRepository extends JpaRepository<WellbeingPublication, Integer> {
    List<WellbeingPublication> findBySectionOrderByDateDesc(String section);
    List<WellbeingPublication> findAllByOrderByDateDesc();
}