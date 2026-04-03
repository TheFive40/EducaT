package com.github.net.educat.repository;

import com.github.net.educat.domain.ForumMessage;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface ForumMessageRepository extends JpaRepository<ForumMessage, Integer> {
    List<ForumMessage> findByForumId(Integer forumId);
}
