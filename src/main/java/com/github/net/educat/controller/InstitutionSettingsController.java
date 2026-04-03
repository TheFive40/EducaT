package com.github.net.educat.controller;

import com.github.net.educat.dto.request.InstitutionSettingsRequest;
import com.github.net.educat.dto.response.InstitutionSettingsResponse;
import com.github.net.educat.application.InstitutionSettingsService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/institution-settings")
@RequiredArgsConstructor
public class InstitutionSettingsController {
    private final InstitutionSettingsService institutionSettingsService;

    @GetMapping
    public ResponseEntity<List<InstitutionSettingsResponse>> findAll() {
        return ResponseEntity.ok(institutionSettingsService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<InstitutionSettingsResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(institutionSettingsService.findById(id));
    }
    @PostMapping
    public ResponseEntity<InstitutionSettingsResponse> save(@Valid @RequestBody InstitutionSettingsRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(institutionSettingsService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<InstitutionSettingsResponse> update(@PathVariable Integer id, @Valid @RequestBody InstitutionSettingsRequest request) {
        return ResponseEntity.ok(institutionSettingsService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        institutionSettingsService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
