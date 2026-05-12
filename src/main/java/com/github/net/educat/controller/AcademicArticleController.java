package com.github.net.educat.controller;

import com.github.net.educat.dto.request.ArticleRequest;
import com.github.net.educat.dto.response.ArticleResponse;
import com.github.net.educat.application.AcademicArticleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/articles")
@RequiredArgsConstructor
public class AcademicArticleController {
    private final AcademicArticleService articleService;

    @GetMapping
    public ResponseEntity<List<ArticleResponse>> findAll() {
        return ResponseEntity.ok(articleService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ArticleResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(articleService.findById(id));
    }
    @PostMapping
    public ResponseEntity<ArticleResponse> save(@Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(articleService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ArticleResponse> update(@PathVariable Integer id, @Valid @RequestBody ArticleRequest request) {
        return ResponseEntity.ok(articleService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        articleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
