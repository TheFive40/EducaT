package com.github.net.educat.controller;

import com.github.net.educat.application.ExamService;
import com.github.net.educat.dto.request.ExamRequest;
import com.github.net.educat.dto.response.ExamResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.List;

@RestController
@RequestMapping("/api/exams")
@RequiredArgsConstructor
public class ExamController {
    private final ExamService examService;

    @GetMapping
    public ResponseEntity<List<ExamResponse>> findAll() {
        return ResponseEntity.ok(examService.findAll());
    }

    @GetMapping("/{id}")
    public ResponseEntity<ExamResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(examService.findById(id));
    }

    @GetMapping("/course/{courseId}")
    public ResponseEntity<List<ExamResponse>> findByCourse(@PathVariable Integer courseId) {
        return ResponseEntity.ok(examService.findByCourseId(courseId));
    }

    @PostMapping
    public ResponseEntity<ExamResponse> save(@Valid @RequestBody ExamRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(examService.save(request));
    }

    @PutMapping("/{id}")
    public ResponseEntity<ExamResponse> update(@PathVariable Integer id, @Valid @RequestBody ExamRequest request) {
        return ResponseEntity.ok(examService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        examService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/seb-config")
    public ResponseEntity<byte[]> downloadSebConfig(@PathVariable Integer id, HttpServletRequest request) {
        ExamResponse exam = examService.findById(id);
        if (exam == null || !Boolean.TRUE.equals(exam.getRequireSeb())) {
            return ResponseEntity.notFound().build();
        }

        String baseUrl = request.getScheme() + "://" + request.getServerName();
        if (request.getServerPort() != 80 && request.getServerPort() != 443) {
            baseUrl += ":" + request.getServerPort();
        }
        String startUrl = baseUrl + "/exam/" + id;
        String quitUrl = baseUrl + "/exam/" + id + "/finished";

        String sebXml = """
                <?xml version="1.0" encoding="UTF-8"?>
                <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
                <plist version="1.0">
                <dict>
                    <key>originatorVersion</key>
                    <string>SEB 3.0</string>
                    <key>startURL</key>
                    <string>%s</string>
                    <key>sebServerURL</key>
                    <string></string>
                    <key>hashedAdminPassword</key>
                    <string></string>
                    <key>hashedQuitPassword</key>
                    <string></string>
                    <key>allowQuit</key>
                    <false/>
                    <key>quitURL</key>
                    <string>%s</string>
                    <key>browserUserAgent</key>
                    <string>EducaT-SEB</string>
                    <key>browserWindowAllowReloading</key>
                    <false/>
                    <key>allowPreferencesWindow</key>
                    <false/>
                    <key>createNewDesktop</key>
                    <true/>
                    <key>killExplorerShell</key>
                    <true/>
                    <key>enableAppSwitcherCheck</key>
                    <true/>
                    <key>enableProcessMonitor</key>
                    <true/>
                </dict>
                </plist>
                """.formatted(startUrl, quitUrl);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_OCTET_STREAM);
        headers.setContentDispositionFormData("attachment", "educat-exam-" + id + ".seb");
        return new ResponseEntity<>(sebXml.getBytes(java.nio.charset.StandardCharsets.UTF_8), headers, HttpStatus.OK);
    }
}
