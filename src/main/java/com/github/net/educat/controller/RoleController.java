package com.github.net.educat.controller;

import com.github.net.educat.dto.request.RoleRequest;
import com.github.net.educat.dto.response.RoleResponse;
import com.github.net.educat.application.RoleService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/roles")
@RequiredArgsConstructor
public class RoleController {
    private final RoleService roleService;

    @GetMapping
    public ResponseEntity<List<RoleResponse>> findAll() {
        return ResponseEntity.ok(roleService.findAll());
    }
    @GetMapping("/{id}")
    public ResponseEntity<RoleResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(roleService.findById(id));
    }
    @PostMapping
    public ResponseEntity<RoleResponse> save(@Valid @RequestBody RoleRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(roleService.save(request));
    }
    @PutMapping("/{id}")
    public ResponseEntity<RoleResponse> update(@PathVariable Integer id, @Valid @RequestBody RoleRequest request) {
        return ResponseEntity.ok(roleService.update(id, request));
    }
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        roleService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
