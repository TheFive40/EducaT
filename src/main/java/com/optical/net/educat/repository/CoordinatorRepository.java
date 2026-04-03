package com.optical.net.educat.repository;

import com.optical.net.educat.domain.Coordinator;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface CoordinatorRepository extends JpaRepository<Coordinator, Integer> {
}
