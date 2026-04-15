package com.github.net.educat.repository;

import com.github.net.educat.domain.Role;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface RoleRepository extends JpaRepository<Role, Integer> {
	Optional<Role> findFirstByNameIgnoreCase(String name);
}
