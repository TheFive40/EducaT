package com.optical.net.educat.controller;

import com.optical.net.educat.dto.request.CertificateRequest;
import com.optical.net.educat.dto.response.CertificateResponse;
import com.optical.net.educat.application.CertificateService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/certificates")
@RequiredArgsConstructor
public class CertificateController {
    private final CertificateService certificateService;

    @GetMapping
    public ResponseEntity<List<CertificateResponse>> findAll() {
        return ResponseEntity.ok(certificateService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<CertificateResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(certificateService.findById(id));
    }
    @GetMapping("/student/{studentId}")
    public ResponseEntity<List<CertificateResponse>> findByStudent(@PathVariable Integer studentId) {
        return ResponseEntity.ok(certificateService.findByStudentId(studentId));
    }
    @PostMapping
    public ResponseEntity<CertificateResponse> save(@Valid @RequestBody CertificateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(certificateService.save(request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        certificateService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
