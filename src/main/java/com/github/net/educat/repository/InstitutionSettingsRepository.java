package com.github.net.educat.repository;

import com.github.net.educat.domain.InstitutionSettings;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface InstitutionSettingsRepository extends JpaRepository<InstitutionSettings, Integer> {
}
