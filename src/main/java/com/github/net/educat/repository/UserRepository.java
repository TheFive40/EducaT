package com.github.net.educat.repository;

import com.github.net.educat.domain.User;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.Optional;

@Repository
public interface UserRepository extends JpaRepository<User, Integer> {
    Optional<User> findByEmail(String email);
    boolean existsByEmail(String email);
    Page<User> findByEmailContainingIgnoreCaseOrNameContainingIgnoreCase(String email, String name, Pageable pageable);
}
