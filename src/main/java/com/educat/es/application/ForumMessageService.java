package com.educat.es.application;

import com.educat.es.dto.request.ForumMessageRequest;
import com.educat.es.dto.response.ForumMessageResponse;
import java.util.List;

public interface ForumMessageService {
    List<ForumMessageResponse> findAll();
    ForumMessageResponse findById(Integer id);
    ForumMessageResponse save(ForumMessageRequest request);
    void delete(Integer id);
    List<ForumMessageResponse> findByForumId(Integer forumId);
}
