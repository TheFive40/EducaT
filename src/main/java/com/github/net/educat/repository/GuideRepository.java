package com.github.net.educat.repository;

import com.github.net.educat.domain.Guide;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface GuideRepository extends JpaRepository<Guide, Integer> {
}