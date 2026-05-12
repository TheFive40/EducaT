package com.github.net.educat.service;

import com.github.net.educat.domain.AcademicArticle;
import com.github.net.educat.dto.request.ArticleRequest;
import com.github.net.educat.dto.response.ArticleResponse;
import com.github.net.educat.mapper.ArticleMapper;
import com.github.net.educat.repository.AcademicArticleRepository;
import com.github.net.educat.application.AcademicArticleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicArticleServiceImpl implements AcademicArticleService {
    private final AcademicArticleRepository articleRepository;
    private final ArticleMapper articleMapper;

    @Override @Transactional(readOnly = true)
    public List<ArticleResponse> findAll() {
        return articleRepository.findAll().stream().map(articleMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ArticleResponse findById(Integer id) {
        return articleRepository.findById(id).map(articleMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
    }
    @Override
    public ArticleResponse save(ArticleRequest request) {
        AcademicArticle article = articleMapper.toEntity(request);
        article.setPublishedAt(LocalDateTime.now());
        article.setCreatedAt(LocalDateTime.now());
        return articleMapper.toResponse(articleRepository.save(article));
    }
    @Override
    public ArticleResponse update(Integer id, ArticleRequest request) {
        AcademicArticle article = articleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Article not found: " + id));
        article.setTitle(request.getTitle());
        article.setContent(request.getContent());
        article.setSummary(request.getSummary());
        article.setCoverImage(request.getCoverImage());
        article.setAuthor(request.getAuthor());
        return articleMapper.toResponse(articleRepository.save(article));
    }
    @Override
    public void delete(Integer id) {
        if (!articleRepository.existsById(id)) throw new EntityNotFoundException("Article not found: " + id);
        articleRepository.deleteById(id);
    }
}
