package com.educat.es.controller;

import com.educat.es.dto.request.ForumRequest;
import com.educat.es.dto.response.ForumResponse;
import com.educat.es.application.ForumService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/forums")
@RequiredArgsConstructor
public class ForumController {
    private final ForumService forumService;

    @GetMapping
    public ResponseEntity<List<ForumResponse>> findAll() {
        return ResponseEntity.ok(forumService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ForumResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(forumService.findById(id));
    }
    @PostMapping
    public ResponseEntity<ForumResponse> save(@Valid @RequestBody ForumRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(forumService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ForumResponse> update(@PathVariable Integer id, @Valid @RequestBody ForumRequest request) {
        return ResponseEntity.ok(forumService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        forumService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
