package com.educat.es.application;

import com.educat.es.dto.request.NewsRequest;
import com.educat.es.dto.response.NewsResponse;
import java.util.List;

public interface NewsService {
    List<NewsResponse> findAll();
    NewsResponse findById(Integer id);
    NewsResponse save(NewsRequest request);
    NewsResponse update(Integer id, NewsRequest request);
    void delete(Integer id);
}
