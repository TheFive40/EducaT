package com.educat.es.service;

import com.educat.es.domain.News;
import com.educat.es.dto.request.NewsRequest;
import com.educat.es.dto.response.NewsResponse;
import com.educat.es.mapper.NewsMapper;
import com.educat.es.repository.NewsRepository;
import com.educat.es.application.NewsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NewsServiceImpl implements NewsService {
    private final NewsRepository newsRepository;
    private final NewsMapper newsMapper;

    @Override @Transactional(readOnly = true)
    public List<NewsResponse> findAll() {
        return newsRepository.findAll().stream().map(newsMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public NewsResponse findById(Integer id) {
        return newsRepository.findById(id).map(newsMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("News not found: " + id));
    }
    @Override
    public NewsResponse save(NewsRequest request) {
        News news = newsMapper.toEntity(request);
        news.setCreatedAt(LocalDateTime.now());
        return newsMapper.toResponse(newsRepository.save(news));
    }
    @Override
    public NewsResponse update(Integer id, NewsRequest request) {
        News news = newsRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("News not found: " + id));
        news.setTitle(request.getTitle());
        news.setContent(request.getContent());
        return newsMapper.toResponse(newsRepository.save(news));
    }
    @Override
    public void delete(Integer id) {
        if (!newsRepository.existsById(id)) throw new EntityNotFoundException("News not found: " + id);
        newsRepository.deleteById(id);
    }
}
