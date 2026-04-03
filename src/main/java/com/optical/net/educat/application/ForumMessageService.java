package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.ForumMessageRequest;
import com.optical.net.educat.dto.response.ForumMessageResponse;
import java.util.List;

public interface ForumMessageService {
    List<ForumMessageResponse> findAll();
    ForumMessageResponse findById(Integer id);
    ForumMessageResponse save(ForumMessageRequest request);
    void delete(Integer id);
    List<ForumMessageResponse> findByForumId(Integer forumId);
}
