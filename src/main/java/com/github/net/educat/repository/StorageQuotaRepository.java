package com.github.net.educat.repository;

import com.github.net.educat.domain.StorageQuota;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface StorageQuotaRepository extends JpaRepository<StorageQuota, Integer> {
    Optional<StorageQuota> findByOwnerTypeAndOwnerId(String ownerType, String ownerId);
}
