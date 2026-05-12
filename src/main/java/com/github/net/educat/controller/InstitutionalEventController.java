package com.github.net.educat.controller;

import com.github.net.educat.dto.request.EventRequest;
import com.github.net.educat.dto.response.EventResponse;
import com.github.net.educat.application.InstitutionalEventService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/events")
@RequiredArgsConstructor
public class InstitutionalEventController {
    private final InstitutionalEventService eventService;

    @GetMapping
    public ResponseEntity<List<EventResponse>> findAll() {
        return ResponseEntity.ok(eventService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<EventResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(eventService.findById(id));
    }
    @PostMapping
    public ResponseEntity<EventResponse> save(@Valid @RequestBody EventRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(eventService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<EventResponse> update(@PathVariable Integer id, @Valid @RequestBody EventRequest request) {
        return ResponseEntity.ok(eventService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        eventService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
