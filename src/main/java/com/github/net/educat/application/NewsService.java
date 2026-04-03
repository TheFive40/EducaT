package com.github.net.educat.application;

import com.github.net.educat.dto.request.NewsRequest;
import com.github.net.educat.dto.response.NewsResponse;
import java.util.List;

public interface NewsService {
    List<NewsResponse> findAll();
    NewsResponse findById(Integer id);
    NewsResponse save(NewsRequest request);
    NewsResponse update(Integer id, NewsRequest request);
    void delete(Integer id);
}
