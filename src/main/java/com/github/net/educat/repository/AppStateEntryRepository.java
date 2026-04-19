package com.github.net.educat.repository;

import com.github.net.educat.domain.AppStateEntry;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface AppStateEntryRepository extends JpaRepository<AppStateEntry, Integer> {
    Optional<AppStateEntry> findByStorageKey(String storageKey);
    List<AppStateEntry> findByStorageKeyStartingWith(String prefix);
    void deleteByStorageKey(String storageKey);
    void deleteByStorageKeyStartingWith(String prefix);
}

