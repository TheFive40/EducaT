package com.github.net.educat.application;

import com.github.net.educat.dto.request.ForumRequest;
import com.github.net.educat.dto.response.ForumResponse;
import java.util.List;

public interface ForumService {
    List<ForumResponse> findAll();
    ForumResponse findById(Integer id);
    ForumResponse save(ForumRequest request);
    ForumResponse update(Integer id, ForumRequest request);
    void delete(Integer id);
}
