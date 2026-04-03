package com.optical.net.educat.repository;

import com.optical.net.educat.domain.Theme;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ThemeRepository extends JpaRepository<Theme, Integer> {
    List<Theme> findBySettingsId(Integer settingsId);
}
