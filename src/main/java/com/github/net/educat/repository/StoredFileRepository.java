package com.github.net.educat.repository;

import com.github.net.educat.domain.StoredFile;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StoredFileRepository extends JpaRepository<StoredFile, Integer> {
    Optional<StoredFile> findByFileHash(String fileHash);
    boolean existsByFileHash(String fileHash);
}
