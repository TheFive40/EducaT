package com.github.net.educat.repository;

import com.github.net.educat.domain.UserPermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface UserPermissionRepository extends JpaRepository<UserPermission, Integer> {
    List<UserPermission> findByUserId(Integer userId);
    void deleteByUserId(Integer userId);
    List<UserPermission> findByUser_Id(Integer userId);
    void deleteByUser_Id(Integer userId);
}