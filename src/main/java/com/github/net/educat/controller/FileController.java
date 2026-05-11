package com.github.net.educat.controller;

import com.github.net.educat.application.StorageService;
import com.github.net.educat.domain.StoredFile;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
public class FileController {

    private final StorageService storageService;

    @PostMapping("/upload")
    public ResponseEntity<StoredFile> uploadFile(
            @RequestParam("file") MultipartFile file,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") String entityId,
            @RequestParam(value = "fieldName", required = false) String fieldName) throws IOException {
        StoredFile stored = storageService.storeFile(file, entityType, entityId, fieldName);
        return ResponseEntity.ok(stored);
    }

    @PostMapping("/upload-bytes")
    public ResponseEntity<StoredFile> uploadBytes(
            @RequestBody byte[] data,
            @RequestParam("fileName") String fileName,
            @RequestParam("contentType") String contentType,
            @RequestParam("entityType") String entityType,
            @RequestParam("entityId") String entityId,
            @RequestParam(value = "fieldName", required = false) String fieldName) throws IOException {
        StoredFile stored = storageService.storeBytes(data, fileName, contentType, entityType, entityId, fieldName);
        return ResponseEntity.ok(stored);
    }

    @GetMapping("/download/{storedFileId}")
    public ResponseEntity<Resource> downloadFile(@PathVariable Integer storedFileId) {
        StoredFile sf = storageService.getStoredFile(storedFileId);
        Resource resource = storageService.downloadFile(storedFileId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(sf.getContentType()))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=\"" + sf.getFileName() + "\"")
                .body(resource);
    }
}
