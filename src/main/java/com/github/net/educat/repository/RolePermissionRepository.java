package com.github.net.educat.repository;

import com.github.net.educat.domain.RolePermission;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface RolePermissionRepository extends JpaRepository<RolePermission, Integer> {
    List<RolePermission> findByRoleId(Integer roleId);
    void deleteByRoleId(Integer roleId);
    List<RolePermission> findByRole_Id(Integer roleId);
    void deleteByRole_Id(Integer roleId);
}