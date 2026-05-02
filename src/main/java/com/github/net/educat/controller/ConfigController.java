package com.github.net.educat.controller;

import com.github.net.educat.application.ConfigService;
import com.github.net.educat.dto.response.ConfigResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/config")
@RequiredArgsConstructor
public class ConfigController {
    private final ConfigService configService;

    @GetMapping("/grade-policy")
    public ResponseEntity<ConfigResponse> getGradePolicy() {
        return ResponseEntity.ok(configService.getGradePolicy());
    }

    @PutMapping("/grade-policy")
    public ResponseEntity<ConfigResponse> saveGradePolicy(@RequestBody String policy) {
        return ResponseEntity.ok(configService.saveGradePolicy(policy));
    }

    @GetMapping("/enrollment-form-config")
    public ResponseEntity<ConfigResponse> getEnrollmentFormConfig() {
        return ResponseEntity.ok(configService.getEnrollmentFormConfig());
    }

    @PutMapping("/enrollment-form-config")
    public ResponseEntity<ConfigResponse> saveEnrollmentFormConfig(@RequestBody String config) {
        return ResponseEntity.ok(configService.saveEnrollmentFormConfig(config));
    }

    @GetMapping("/wellbeing-catalog")
    public ResponseEntity<ConfigResponse> getWellbeingCatalog() {
        return ResponseEntity.ok(configService.getWellbeingCatalog());
    }

    @PutMapping("/wellbeing-catalog")
    public ResponseEntity<ConfigResponse> saveWellbeingCatalog(@RequestBody String catalog) {
        return ResponseEntity.ok(configService.saveWellbeingCatalog(catalog));
    }

    @GetMapping("/assignment-rules")
    public ResponseEntity<ConfigResponse> getAssignmentRules() {
        return ResponseEntity.ok(configService.getAssignmentRules());
    }

    @PutMapping("/assignment-rules")
    public ResponseEntity<ConfigResponse> saveAssignmentRules(@RequestBody String rules) {
        return ResponseEntity.ok(configService.saveAssignmentRules(rules));
    }
}