package com.github.net.educat.controller;

import com.github.net.educat.application.CertificateTemplateService;
import com.github.net.educat.dto.request.CertificateTemplateRequest;
import com.github.net.educat.dto.response.CertificateTemplateResponse;
import com.github.net.educat.service.CertificateTemplateFactory;
import com.github.net.educat.service.DocxToHtmlConverter;
import com.github.net.educat.service.DocxVariableExtractor;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.ClassPathResource;
import org.springframework.http.*;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@RestController
@RequestMapping("/api/certificate-templates")
@RequiredArgsConstructor
public class CertificateTemplateController {

    private final CertificateTemplateService templateService;
    private final CertificateTemplateFactory templateFactory;
    private final DocxToHtmlConverter docxToHtmlConverter;
    private final DocxVariableExtractor docxVariableExtractor;

    private static final String UPLOAD_DIR = "educat-uploads/cert-templates";

    /* ═══════════════════════════════════════════════════════════════
       ENDPOINTS LITERALES (sin path variables) - DEBEN IR PRIMERO
       ═══════════════════════════════════════════════════════════════ */

    @GetMapping
    public ResponseEntity<List<CertificateTemplateResponse>> findAll() {
        return ResponseEntity.ok(templateService.findAll());
    }

    @PostMapping
    public ResponseEntity<CertificateTemplateResponse> save(@Valid @RequestBody CertificateTemplateRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(templateService.save(request));
    }

    @PostMapping("/base")
    public ResponseEntity<Map<String, Object>> createBaseTemplate() {
        try {
            Map<String, Object> config = templateFactory.createBaseConfig();
            return ResponseEntity.ok(Map.of(
                    "headerText", config.get("headerText"),
                    "subtitleText", config.get("subtitleText"),
                    "bodyLinesJson", config.get("bodyLinesJson"),
                    "footerText", config.get("footerText"),
                    "styleConfigJson", config.get("styleConfigJson"),
                    "basePdfResource", config.getOrDefault("basePdfResource", "pdf-modern-vintage"),
                    "message", "Configuración base obtenida correctamente"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "No se pudo obtener la configuración base: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/convert-docx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, String>> convertDocx(@RequestParam("file") MultipartFile file) {
        try {
            String html = docxToHtmlConverter.convert(file.getInputStream());
            return ResponseEntity.ok(Map.of("html", html));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to convert docx: " + e.getMessage()));
        }
    }

    @GetMapping("/base-docx-list")
    public ResponseEntity<List<Map<String, String>>> listBaseDocx() {
        return ResponseEntity.ok(List.of(
            Map.of("id", "modern-vintage", "name", "Modern Vintage (Ingles)"),
            Map.of("id", "vintage-beige-dorado", "name", "Diploma Vintage Beige y Dorado"),
            Map.of("id", "negro-dorado", "name", "Reconocimiento Negro y Dorado"),
            Map.of("id", "beige-negro", "name", "Diploma Elegante Beige y Negro")
        ));
    }

    @GetMapping("/base-docx-html/{resourceName}")
    public ResponseEntity<Map<String, String>> getBaseDocxHtml(@PathVariable String resourceName) {
        try (InputStream is = new ClassPathResource("certificate-bases/" + resourceName + ".docx").getInputStream()) {
            String html = docxToHtmlConverter.convert(is);
            return ResponseEntity.ok(Map.of("html", html));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Failed to load base docx: " + e.getMessage()));
        }
    }

    @PostMapping(value = "/upload-docx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocx(@RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacio"));
            }
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = UUID.randomUUID() + ".docx";
            Path targetPath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath);

            Set<String> variables = docxVariableExtractor.extractVariables(Files.newInputStream(targetPath));
            return ResponseEntity.ok(Map.of(
                    "filePath", targetPath.toString(),
                    "variables", variables,
                    "message", "Archivo subido correctamente"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error subiendo archivo: " + e.getMessage()));
        }
    }

    /* ═══════════════════════════════════════════════════════════════
       ENDPOINTS CON PATH VARIABLE {id} - VAN DESPUÉS
       ═══════════════════════════════════════════════════════════════ */

    @GetMapping("/{id}")
    public ResponseEntity<CertificateTemplateResponse> findById(@PathVariable Integer id) {
        return ResponseEntity.ok(templateService.findById(id));
    }

    @PutMapping("/{id}")
    public ResponseEntity<CertificateTemplateResponse> update(@PathVariable Integer id, @Valid @RequestBody CertificateTemplateRequest request) {
        return ResponseEntity.ok(templateService.update(id, request));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> delete(@PathVariable Integer id) {
        templateService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/{id}/preview/{studentId}")
    public ResponseEntity<byte[]> preview(@PathVariable Integer id, @PathVariable Integer studentId) {
        byte[] pdf = templateService.generatePreview(id, studentId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=preview.pdf")
                .body(pdf);
    }

    @GetMapping("/{id}/generate/{studentId}")
    public ResponseEntity<byte[]> generate(@PathVariable Integer id, @PathVariable Integer studentId) {
        byte[] pdf = templateService.generateCertificate(id, studentId);
        return ResponseEntity.ok()
                .contentType(MediaType.APPLICATION_PDF)
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=certificado.pdf")
                .body(pdf);
    }

    @GetMapping("/{id}/generate-docx/{studentId}")
    public ResponseEntity<byte[]> generateDocx(@PathVariable Integer id, @PathVariable Integer studentId) {
        byte[] docx = templateService.generateDocx(id, studentId);
        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType("application/vnd.openxmlformats-officedocument.wordprocessingml.document"))
                .header(HttpHeaders.CONTENT_DISPOSITION, "attachment; filename=certificado.docx")
                .body(docx);
    }

    @PostMapping(value = "/{id}/upload-docx", consumes = MediaType.MULTIPART_FORM_DATA_VALUE)
    public ResponseEntity<Map<String, Object>> uploadDocxForTemplate(
            @PathVariable Integer id,
            @RequestParam("file") MultipartFile file) {
        try {
            if (file.isEmpty()) {
                return ResponseEntity.badRequest().body(Map.of("error", "Archivo vacio"));
            }
            Path uploadPath = Paths.get(UPLOAD_DIR);
            if (!Files.exists(uploadPath)) {
                Files.createDirectories(uploadPath);
            }
            String fileName = "template-" + id + "-" + UUID.randomUUID() + ".docx";
            Path targetPath = uploadPath.resolve(fileName);
            Files.copy(file.getInputStream(), targetPath);

            Set<String> variables = docxVariableExtractor.extractVariables(Files.newInputStream(targetPath));

            // Update template with new file path
            CertificateTemplateResponse existing = templateService.findById(id);
            CertificateTemplateRequest request = new CertificateTemplateRequest();
            request.setName(existing.getName());
            request.setDescription(existing.getDescription());
            request.setHeaderText(existing.getHeaderText());
            request.setSubtitleText(existing.getSubtitleText());
            request.setBodyLinesJson(existing.getBodyLinesJson());
            request.setFooterText(existing.getFooterText());
            request.setStyleConfigJson(existing.getStyleConfigJson());
            request.setConditionsJson(existing.getConditionsJson());
            request.setSignatureImageData(existing.getSignatureImageData());
            request.setSignatureType(existing.getSignatureType());
            request.setSignatureLabel(existing.getSignatureLabel());
            request.setSignatureImageData2(existing.getSignatureImageData2());
            request.setSignatureType2(existing.getSignatureType2());
            request.setSignatureLabel2(existing.getSignatureLabel2());
            request.setBasePdfResource(existing.getBasePdfResource());
            request.setBaseDocxResource(existing.getBaseDocxResource());
            request.setEditableHtml(existing.getEditableHtml());
            request.setFieldPositionsJson(existing.getFieldPositionsJson());
            request.setDocxFilePath(targetPath.toString());
            templateService.update(id, request);

            return ResponseEntity.ok(Map.of(
                    "filePath", targetPath.toString(),
                    "variables", variables,
                    "message", "Archivo subido y asociado a la plantilla"
            ));
        } catch (Exception e) {
            return ResponseEntity.status(HttpStatus.INTERNAL_SERVER_ERROR)
                    .body(Map.of("error", "Error subiendo archivo: " + e.getMessage()));
        }
    }

    @PostMapping("/{id}/mass-generate")
    public ResponseEntity<Map<String, Object>> massGenerate(
            @PathVariable Integer id,
            @RequestBody(required = false) List<Integer> studentIds) {
        return ResponseEntity.ok(templateService.massGenerate(id, studentIds));
    }
}
