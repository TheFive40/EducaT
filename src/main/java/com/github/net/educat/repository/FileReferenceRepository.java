package com.github.net.educat.repository;

import com.github.net.educat.domain.FileReference;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface FileReferenceRepository extends JpaRepository<FileReference, Integer> {
    List<FileReference> findByEntityTypeAndEntityId(String entityType, String entityId);
    List<FileReference> findByStoredFileId(Integer storedFileId);
    Optional<FileReference> findByStoredFileIdAndEntityTypeAndEntityId(Integer storedFileId, String entityType, String entityId);
    long countByStoredFileId(Integer storedFileId);
}
