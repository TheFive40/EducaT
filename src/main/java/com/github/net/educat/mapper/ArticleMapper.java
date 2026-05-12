package com.github.net.educat.mapper;

import com.github.net.educat.domain.AcademicArticle;
import com.github.net.educat.dto.request.ArticleRequest;
import com.github.net.educat.dto.response.ArticleResponse;
import org.springframework.stereotype.Component;

@Component
public class ArticleMapper {
    public ArticleResponse toResponse(AcademicArticle article) {
        return ArticleResponse.builder()
                .id(article.getId())
                .title(article.getTitle())
                .content(article.getContent())
                .summary(article.getSummary())
                .coverImage(article.getCoverImage())
                .author(article.getAuthor())
                .publishedAt(article.getPublishedAt())
                .createdAt(article.getCreatedAt())
                .build();
    }
    public AcademicArticle toEntity(ArticleRequest request) {
        return AcademicArticle.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .summary(request.getSummary())
                .coverImage(request.getCoverImage())
                .author(request.getAuthor())
                .build();
    }
}
