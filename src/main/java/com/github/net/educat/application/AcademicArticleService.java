package com.github.net.educat.application;

import com.github.net.educat.dto.request.ArticleRequest;
import com.github.net.educat.dto.response.ArticleResponse;
import java.util.List;

public interface AcademicArticleService {
    List<ArticleResponse> findAll();
    ArticleResponse findById(Integer id);
    ArticleResponse save(ArticleRequest request);
    ArticleResponse update(Integer id, ArticleRequest request);
    void delete(Integer id);
}
