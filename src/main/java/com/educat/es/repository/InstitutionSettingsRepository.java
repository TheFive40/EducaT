package com.educat.es.repository;

import com.educat.es.domain.InstitutionSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstitutionSettingsRepository extends JpaRepository<InstitutionSettings, Integer> {
}
