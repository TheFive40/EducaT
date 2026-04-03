package com.educat.es.application;

import com.educat.es.dto.request.ForumRequest;
import com.educat.es.dto.response.ForumResponse;
import java.util.List;

public interface ForumService {
    List<ForumResponse> findAll();
    ForumResponse findById(Integer id);
    ForumResponse save(ForumRequest request);
    ForumResponse update(Integer id, ForumRequest request);
    void delete(Integer id);
}
