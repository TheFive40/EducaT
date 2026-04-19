package com.github.net.educat.controller;

import com.github.net.educat.application.AppStateService;
import com.github.net.educat.dto.request.AppStateValueRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.LinkedHashMap;
import java.util.Map;

@RestController
@RequestMapping("/api/app-state")
@RequiredArgsConstructor
public class AppStateController {
    private final AppStateService appStateService;

    @GetMapping
    public ResponseEntity<Map<String, String>> findByPrefix(@RequestParam(required = false) String prefix) {
        return ResponseEntity.ok(appStateService.findByPrefix(prefix));
    }

    @GetMapping("/{key:.+}")
    public ResponseEntity<Map<String, String>> findByKey(@PathVariable String key) {
        String value = appStateService.findByKey(key);
        if (value == null) {
            return ResponseEntity.notFound().build();
        }
        Map<String, String> response = new LinkedHashMap<>();
        response.put("key", key);
        response.put("value", value);
        return ResponseEntity.ok(response);
    }

    @PutMapping("/{key:.+}")
    public ResponseEntity<Map<String, String>> upsert(@PathVariable String key, @Valid @RequestBody AppStateValueRequest request) {
        String value = appStateService.upsert(key, request.getValue());
        Map<String, String> response = new LinkedHashMap<>();
        response.put("key", key);
        response.put("value", value);
        return ResponseEntity.ok(response);
    }

    @DeleteMapping("/{key:.+}")
    public ResponseEntity<Void> deleteByKey(@PathVariable String key) {
        appStateService.deleteByKey(key);
        return ResponseEntity.noContent().build();
    }

    @DeleteMapping
    public ResponseEntity<Void> deleteByPrefix(@RequestParam(required = false) String prefix) {
        appStateService.deleteByPrefix(prefix);
        return ResponseEntity.noContent().build();
    }
}

