package com.github.net.educat.controller;

import com.github.net.educat.application.GuideService;
import com.github.net.educat.dto.request.GuideRequest;
import com.github.net.educat.dto.response.GuideResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/guides")
@RequiredArgsConstructor
public class GuideController {
    private final GuideService guideService;

    @GetMapping
    public ResponseEntity<List<GuideResponse>> findAll(
            @RequestParam(required = false) String search,
            @RequestParam(required = false) String audience) {
        return ResponseEntity.ok(guideService.findAll(search, audience));
    }

    @GetMapping("/{id}")
    public ResponseEntity<GuideResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(guideService.findById(id));
    }

    @PostMapping
    public ResponseEntity<GuideResponse> save(@Valid @RequestBody GuideRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(guideService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<GuideResponse> update(@PathVariable Integer id, @Valid @RequestBody GuideRequest request) {
        return ResponseEntity.ok(guideService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        guideService.delete(id);
        return ResponseEntity.noContent().build();
    }
}