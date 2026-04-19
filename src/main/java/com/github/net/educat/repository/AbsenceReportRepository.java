package com.github.net.educat.repository;

import com.github.net.educat.domain.AbsenceReport;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.stereotype.Repository;

@Repository
public interface AbsenceReportRepository extends JpaRepository<AbsenceReport, Integer>, JpaSpecificationExecutor<AbsenceReport> {
}

