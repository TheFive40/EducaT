package com.github.net.educat.mapper;

import com.github.net.educat.domain.News;
import com.github.net.educat.dto.request.NewsRequest;
import com.github.net.educat.dto.response.NewsResponse;
import org.springframework.stereotype.Component;

@Component
public class NewsMapper {
    public NewsResponse toResponse(News news) {
        return NewsResponse.builder()
                .id(news.getId())
                .title(news.getTitle())
                .content(news.getContent())
                .summary(news.getSummary())
                .coverImage(news.getCoverImage())
                .author(news.getAuthor())
                .publishedAt(news.getPublishedAt())
                .createdAt(news.getCreatedAt())
                .build();
    }
    public News toEntity(NewsRequest request) {
        return News.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .summary(request.getSummary())
                .coverImage(request.getCoverImage())
                .author(request.getAuthor())
                .build();
    }
}
