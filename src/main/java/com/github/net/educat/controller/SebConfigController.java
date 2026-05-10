package com.github.net.educat.controller;

import com.github.net.educat.application.ExamService;
import com.github.net.educat.dto.response.ExamResponse;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpHeaders;
import org.springframework.http.HttpStatus;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequiredArgsConstructor
public class SebConfigController {

    private final ExamService examService;

    @GetMapping("/seb-config/{id}")
    public ResponseEntity<byte[]> downloadSebConfig(@PathVariable Integer id, HttpServletRequest request) {
        ExamResponse exam = examService.findById(id);
        if (exam == null || !Boolean.TRUE.equals(exam.getRequireSeb())) {
            return ResponseEntity.notFound().build();
        }

        String baseUrl = request.getScheme() + "://" + request.getServerName();
        if (request.getServerPort() != 80 && request.getServerPort() != 443) {
            baseUrl += ":" + request.getServerPort();
        }
        String startUrl = baseUrl + "/student-dashboard?sebExamId=" + id;
        String quitUrl = baseUrl + "/student-dashboard";

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
                    <true/>
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
