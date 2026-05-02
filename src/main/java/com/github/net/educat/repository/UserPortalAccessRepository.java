package com.github.net.educat.repository;

import com.github.net.educat.domain.UserPortalAccess;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface UserPortalAccessRepository extends JpaRepository<UserPortalAccess, Integer> {
    Optional<UserPortalAccess> findByUserId(Integer userId);
    void deleteByUserId(Integer userId);
    Optional<UserPortalAccess> findByUser_Id(Integer userId);
    void deleteByUser_Id(Integer userId);
}