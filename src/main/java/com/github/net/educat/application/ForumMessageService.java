package com.github.net.educat.application;

import com.github.net.educat.dto.request.ForumMessageRequest;
import com.github.net.educat.dto.response.ForumMessageResponse;
import java.util.List;

public interface ForumMessageService {
    List<ForumMessageResponse> findAll();
    ForumMessageResponse findById(Integer id);
    ForumMessageResponse save(ForumMessageRequest request);
    void delete(Integer id);
    List<ForumMessageResponse> findByForumId(Integer forumId);
}
