package com.github.net.educat.repository;

import com.github.net.educat.domain.WellbeingRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface WellbeingRequestRepository extends JpaRepository<WellbeingRequest, Integer>, JpaSpecificationExecutor<WellbeingRequest> {
}

