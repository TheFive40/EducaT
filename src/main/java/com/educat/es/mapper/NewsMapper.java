package com.educat.es.mapper;

import com.educat.es.domain.News;
import com.educat.es.dto.request.NewsRequest;
import com.educat.es.dto.response.NewsResponse;
import org.springframework.stereotype.Component;

@Component
public class NewsMapper {
    public NewsResponse toResponse(News news) {
        return NewsResponse.builder()
                .id(news.getId())
                .title(news.getTitle())
                .content(news.getContent())
                .createdAt(news.getCreatedAt())
                .build();
    }
    public News toEntity(NewsRequest request) {
        return News.builder()
                .title(request.getTitle())
                .content(request.getContent())
                .build();
    }
}
