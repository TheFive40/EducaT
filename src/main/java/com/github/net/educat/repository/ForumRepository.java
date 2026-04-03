package com.github.net.educat.repository;

import com.github.net.educat.domain.Forum;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

@Repository
public interface ForumRepository extends JpaRepository<Forum, Integer> {
}
