package com.github.net.educat.controller;

import com.github.net.educat.dto.request.ForumMessageRequest;
import com.github.net.educat.dto.response.ForumMessageResponse;
import com.github.net.educat.application.ForumMessageService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/forum-messages")
@RequiredArgsConstructor
public class ForumMessageController {
    private final ForumMessageService forumMessageService;

    @GetMapping
    public ResponseEntity<List<ForumMessageResponse>> findAll() {
        return ResponseEntity.ok(forumMessageService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ForumMessageResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(forumMessageService.findById(id));
    }
    @GetMapping("/forum/{forumId}")
    public ResponseEntity<List<ForumMessageResponse>> findByForum(@PathVariable Integer forumId) {
        return ResponseEntity.ok(forumMessageService.findByForumId(forumId));
    }
    @PostMapping
    public ResponseEntity<ForumMessageResponse> save(@Valid @RequestBody ForumMessageRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(forumMessageService.save(request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        forumMessageService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
