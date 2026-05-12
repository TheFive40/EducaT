package com.github.net.educat.repository;

import com.github.net.educat.domain.InstitutionalEvent;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstitutionalEventRepository extends JpaRepository<InstitutionalEvent, Integer> {
}
