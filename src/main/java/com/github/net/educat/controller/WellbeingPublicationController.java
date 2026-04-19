package com.github.net.educat.controller;

import com.github.net.educat.application.WellbeingPublicationService;
import com.github.net.educat.dto.request.WellbeingPublicationRequest;
import com.github.net.educat.dto.response.StudentWellbeingContentResponse;
import com.github.net.educat.dto.response.WellbeingPublicationResponse;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequiredArgsConstructor
public class WellbeingPublicationController {
    private final WellbeingPublicationService wellbeingPublicationService;

    @GetMapping("/api/student/wellbeing/content")
    public ResponseEntity<StudentWellbeingContentResponse> getStudentContent() {
        return ResponseEntity.ok(wellbeingPublicationService.getStudentContent());
    }

    @GetMapping("/api/admin/wellbeing/publications")
    public ResponseEntity<List<WellbeingPublicationResponse>> findAllPublications() {
        return ResponseEntity.ok(wellbeingPublicationService.findAllPublications());
    }

    @PostMapping("/api/admin/wellbeing/publications")
    public ResponseEntity<WellbeingPublicationResponse> createPublication(@Valid @RequestBody WellbeingPublicationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(wellbeingPublicationService.createPublication(request));
    }

    @PutMapping("/api/admin/wellbeing/publications/{id}")
    public ResponseEntity<WellbeingPublicationResponse> updatePublication(@PathVariable String id, @Valid @RequestBody WellbeingPublicationRequest request) {
        return ResponseEntity.ok(wellbeingPublicationService.updatePublication(id, request));
    }

    @DeleteMapping("/api/admin/wellbeing/publications/{id}")
    public ResponseEntity<Void> deletePublication(@PathVariable String id) {
        wellbeingPublicationService.deletePublication(id);
        return ResponseEntity.noContent().build();
    }
}

