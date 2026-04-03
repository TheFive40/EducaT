package com.educat.es.controller;

import com.educat.es.dto.request.NewsRequest;
import com.educat.es.dto.response.NewsResponse;
import com.educat.es.application.NewsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/news")
@RequiredArgsConstructor
public class NewsController {
    private final NewsService newsService;

    @GetMapping
    public ResponseEntity<List<NewsResponse>> findAll() {
        return ResponseEntity.ok(newsService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<NewsResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(newsService.findById(id));
    }
    @PostMapping
    public ResponseEntity<NewsResponse> save(@Valid @RequestBody NewsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(newsService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<NewsResponse> update(@PathVariable Integer id, @Valid @RequestBody NewsRequest request) {
        return ResponseEntity.ok(newsService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        newsService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
