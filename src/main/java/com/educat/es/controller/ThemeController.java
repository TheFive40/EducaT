package com.educat.es.controller;

import com.educat.es.dto.request.ThemeRequest;
import com.educat.es.dto.response.ThemeResponse;
import com.educat.es.application.ThemeService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/themes")
@RequiredArgsConstructor
public class ThemeController {
    private final ThemeService themeService;

    @GetMapping
    public ResponseEntity<List<ThemeResponse>> findAll() {
        return ResponseEntity.ok(themeService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<ThemeResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(themeService.findById(id));
    }
    @PostMapping
    public ResponseEntity<ThemeResponse> save(@Valid @RequestBody ThemeRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(themeService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<ThemeResponse> update(@PathVariable Integer id, @Valid @RequestBody ThemeRequest request) {
        return ResponseEntity.ok(themeService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        themeService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
