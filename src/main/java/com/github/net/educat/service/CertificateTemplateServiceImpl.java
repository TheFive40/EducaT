package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.CertificateTemplateService;
import com.github.net.educat.domain.*;
import com.github.net.educat.dto.request.CertificateTemplateRequest;
import com.github.net.educat.dto.response.CertificateTemplateResponse;
import com.github.net.educat.repository.*;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.Loader;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.JPEGFactory;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.apache.pdfbox.rendering.PDFRenderer;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.awt.Color;
import java.awt.image.BufferedImage;
import java.io.ByteArrayOutputStream;
import java.io.InputStream;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.format.DateTimeFormatter;
import java.util.ArrayList;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
@Transactional
public class CertificateTemplateServiceImpl implements CertificateTemplateService {

    private final CertificateTemplateRepository templateRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository gradeRepository;
    private final CertificateRepository certificateRepository;
    private final AcademicGradeRepository academicGradeRepository;
    private final AcademicLevelRepository academicLevelRepository;
    private final ObjectMapper objectMapper;
    private final DocxToHtmlConverter docxToHtmlConverter;
    private final HtmlToPdfRenderer htmlToPdfRenderer;
    private final DocxCertificateGenerator docxCertificateGenerator;

    @Override @Transactional(readOnly = true)
    public List<CertificateTemplateResponse> findAll() {
        return templateRepository.findAll().stream().map(this::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public CertificateTemplateResponse findById(Integer id) {
        return templateRepository.findById(id).map(this::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Template not found: " + id));
    }

    @Override
    public CertificateTemplateResponse save(CertificateTemplateRequest request) {
        CertificateTemplate t = CertificateTemplate.builder()
                .name(request.getName())
                .description(request.getDescription())
                .headerText(request.getHeaderText())
                .subtitleText(request.getSubtitleText())
                .bodyLinesJson(request.getBodyLinesJson())
                .footerText(request.getFooterText())
                .styleConfigJson(request.getStyleConfigJson())
                .conditionsJson(request.getConditionsJson())
                .signatureImageData(request.getSignatureImageData())
                .signatureType(request.getSignatureType())
                .signatureLabel(request.getSignatureLabel())
                .signatureImageData2(request.getSignatureImageData2())
                .signatureType2(request.getSignatureType2())
                .signatureLabel2(request.getSignatureLabel2())
                .basePdfResource(request.getBasePdfResource())
                .baseDocxResource(request.getBaseDocxResource())
                .editableHtml(request.getEditableHtml())
                .fieldPositionsJson(request.getFieldPositionsJson())
                .docxFilePath(request.getDocxFilePath())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();
        return toResponse(templateRepository.save(t));
    }

    @Override
    public CertificateTemplateResponse update(Integer id, CertificateTemplateRequest request) {
        CertificateTemplate t = templateRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Template not found: " + id));
        t.setName(request.getName());
        t.setDescription(request.getDescription());
        t.setHeaderText(request.getHeaderText());
        t.setSubtitleText(request.getSubtitleText());
        t.setBodyLinesJson(request.getBodyLinesJson());
        t.setFooterText(request.getFooterText());
        t.setStyleConfigJson(request.getStyleConfigJson());
        t.setConditionsJson(request.getConditionsJson());
        t.setSignatureImageData(request.getSignatureImageData());
        t.setSignatureType(request.getSignatureType());
        t.setSignatureLabel(request.getSignatureLabel());
        t.setSignatureImageData2(request.getSignatureImageData2());
        t.setSignatureType2(request.getSignatureType2());
        t.setSignatureLabel2(request.getSignatureLabel2());
        t.setBasePdfResource(request.getBasePdfResource());
        t.setBaseDocxResource(request.getBaseDocxResource());
        t.setEditableHtml(request.getEditableHtml());
        t.setFieldPositionsJson(request.getFieldPositionsJson());
        t.setDocxFilePath(request.getDocxFilePath());
        t.setUpdatedAt(LocalDateTime.now());
        return toResponse(templateRepository.save(t));
    }

    @Override
    public void delete(Integer id) {
        if (!templateRepository.existsById(id)) throw new EntityNotFoundException("Template not found: " + id);
        templateRepository.deleteById(id);
    }

    @Override
    public byte[] generatePreview(Integer templateId, Integer studentId) {
        return generateCertificate(templateId, studentId);
    }

    @Override
    public byte[] generateDocx(Integer templateId, Integer studentId) {
        CertificateTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Template not found: " + templateId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + studentId));

        Map<String, String> placeholders = buildPlaceholders(student);

        if (template.getDocxFilePath() != null && !template.getDocxFilePath().isBlank()) {
            java.nio.file.Path path = java.nio.file.Path.of(template.getDocxFilePath());
            if (java.nio.file.Files.exists(path)) {
                try {
                    byte[] docxBytes = java.nio.file.Files.readAllBytes(path);
                    return docxCertificateGenerator.replaceVariablesInDocxZip(docxBytes, placeholders);
                } catch (Exception e) {
                    log.error("Failed to generate docx from uploaded docx", e);
                    throw new RuntimeException("Failed to generate docx from uploaded docx", e);
                }
            }
        }
        throw new IllegalStateException("No docx file uploaded for this template");
    }

    @Override
    public byte[] generateCertificate(Integer templateId, Integer studentId) {
        CertificateTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Template not found: " + templateId));
        Student student = studentRepository.findById(studentId)
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + studentId));

        Map<String, String> placeholders = buildPlaceholders(student);

        List<String> bodyLines;
        Map<String, Object> style;
        try {
            bodyLines = objectMapper.readValue(template.getBodyLinesJson() != null ? template.getBodyLinesJson() : "[]", new TypeReference<List<String>>() {});
            style = objectMapper.readValue(template.getStyleConfigJson() != null ? template.getStyleConfigJson() : "{}", new TypeReference<Map<String, Object>>() {});
        } catch (Exception e) {
            throw new IllegalStateException("Invalid template JSON", e);
        }

        // If a docx file is uploaded, use it directly (most reliable - preserves all design)
        if (template.getDocxFilePath() != null && !template.getDocxFilePath().isBlank()) {
            java.nio.file.Path path = java.nio.file.Path.of(template.getDocxFilePath());
            if (java.nio.file.Files.exists(path)) {
                try {
                    byte[] docxBytes = java.nio.file.Files.readAllBytes(path);
                    return docxCertificateGenerator.generate(docxBytes, placeholders);
                } catch (Exception e) {
                    log.error("Failed to generate from uploaded docx", e);
                    throw new RuntimeException("Failed to generate from uploaded docx", e);
                }
            }
        }

        String preset = (String) style.getOrDefault("preset", "clasico");

        if (template.getBaseDocxResource() != null && !template.getBaseDocxResource().isBlank()) {
            return generateDocxBasedCertificate(template, student, placeholders);
        }

        if (template.getEditableHtml() != null && !template.getEditableHtml().isBlank()) {
            return generateDocxBasedCertificate(template, student, placeholders);
        }

        if (template.getBasePdfResource() != null && !template.getBasePdfResource().isBlank()) {
            return generatePdfBasedCertificate(template, student, placeholders, bodyLines, style);
        }

        if (CertificateBasePreset.isPdfPreset(preset)) {
            return generatePdfBasedCertificate(template, student, placeholders, bodyLines, style);
        }

        if ("diploma".equals(preset)) {
            return generateDiplomaCertificate(template, student, placeholders, bodyLines, style);
        }

        int headerFontSize = ((Number) style.getOrDefault("headerFontSize", 32)).intValue();
        String headerColor = (String) style.getOrDefault("headerColor", "#1e6b74");
        int bodyFontSize = ((Number) style.getOrDefault("bodyFontSize", 14)).intValue();
        String bodyColor = (String) style.getOrDefault("bodyColor", "#333333");
        int footerFontSize = ((Number) style.getOrDefault("footerFontSize", 11)).intValue();
        String footerColor = (String) style.getOrDefault("footerColor", "#666666");
        String alignment = (String) style.getOrDefault("alignment", "center");

        try (PDDocument doc = new PDDocument()) {
            PDPage page = new PDPage(PDRectangle.A4);
            doc.addPage(page);

            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();
            float margin = 70;
            float contentWidth = w - 2 * margin;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                drawBackgroundByPreset(cs, w, h, preset);

                float y = h - 140;

                // Header
                if (template.getHeaderText() != null && !template.getHeaderText().isBlank()) {
                    if (!"minimalista".equals(preset)) {
                        drawOrnamentalLine(cs, w / 2, y + headerFontSize + 16, 120, parseColor("#c8962e"), preset);
                    }

                    String headerText = replacePlaceholders(template.getHeaderText(), placeholders);
                    PDType1Font headerFont = "moderno".equals(preset)
                            ? new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD)
                            : new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
                    cs.beginText();
                    cs.setFont(headerFont, headerFontSize);
                    cs.setNonStrokingColor(parseColor(headerColor));
                    float textWidth = headerFont.getStringWidth(headerText) / 1000 * headerFontSize;
                    float x = computeX(alignment, margin, w, textWidth);
                    cs.newLineAtOffset(x, y);
                    cs.showText(headerText);
                    cs.endText();
                    y -= headerFontSize + 10;

                    if (!"minimalista".equals(preset)) {
                        drawOrnamentalLine(cs, w / 2, y + 6, 120, parseColor("#c8962e"), preset);
                    } else {
                        cs.setStrokingColor(parseColor(headerColor));
                        cs.setLineWidth(0.5f);
                        cs.moveTo(margin + contentWidth * 0.25f, y + 10);
                        cs.lineTo(margin + contentWidth * 0.75f, y + 10);
                        cs.stroke();
                    }
                    y -= 18;
                }

                // Subtitle
                if (template.getSubtitleText() != null && !template.getSubtitleText().isBlank()) {
                    String subText = replacePlaceholders(template.getSubtitleText(), placeholders);
                    PDType1Font subFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
                    cs.beginText();
                    cs.setFont(subFont, 13);
                    cs.setNonStrokingColor(new Color(90, 90, 90));
                    float textWidth = subFont.getStringWidth(subText) / 1000 * 13;
                    float x = computeX(alignment, margin, w, textWidth);
                    cs.newLineAtOffset(x, y);
                    cs.showText(subText);
                    cs.endText();
                    y -= 44;
                }

                // Body lines
                PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                PDType1Font bodyFontBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                cs.setNonStrokingColor(parseColor(bodyColor));

                for (String line : bodyLines) {
                    if (line == null || line.isBlank()) {
                        y -= bodyFontSize + 8;
                        continue;
                    }
                    String replaced = replacePlaceholders(line, placeholders);
                    if (replaced.isBlank()) continue;

                    List<String> wrapped = wrapText(replaced, contentWidth, bodyFontSize, bodyFont);
                    for (String wl : wrapped) {
                        boolean isDynamic = wl.contains("{{") || (line.contains("{{") && !wl.contains("{{"));
                        PDType1Font currentFont = isDynamic ? bodyFontBold : bodyFont;
                        cs.beginText();
                        cs.setFont(currentFont, bodyFontSize);
                        float textWidth = currentFont.getStringWidth(wl) / 1000 * bodyFontSize;
                        float x = computeX(alignment, margin, w, textWidth);
                        cs.newLineAtOffset(x, y);
                        cs.showText(wl);
                        cs.endText();
                        y -= bodyFontSize + 7;
                    }
                    y -= 8;
                }

                // Footer text
                if (template.getFooterText() != null && !template.getFooterText().isBlank()) {
                    y = Math.max(y, 180);
                    String footerText = replacePlaceholders(template.getFooterText(), placeholders);
                    String[] footerLines = footerText.split("\\n");

                    if (!"minimalista".equals(preset)) {
                        drawOrnamentalLine(cs, w / 2, y + footerFontSize + 10, 100, parseColor("#c8962e"), preset);
                    }
                    y -= 6;

                    PDType1Font footFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                    for (String fl : footerLines) {
                        if (fl == null || fl.isBlank()) {
                            y -= footerFontSize + 4;
                            continue;
                        }
                        cs.beginText();
                        cs.setFont(footFont, footerFontSize);
                        cs.setNonStrokingColor(parseColor(footerColor));
                        float textWidth = footFont.getStringWidth(fl) / 1000 * footerFontSize;
                        float x = computeX(alignment, margin, w, textWidth);
                        cs.newLineAtOffset(x, y);
                        cs.showText(fl);
                        cs.endText();
                        y -= footerFontSize + 5;
                    }
                }

                // Signature image (uploaded or drawn)
                if (template.getSignatureImageData() != null && !template.getSignatureImageData().isBlank()
                        && !"none".equals(template.getSignatureType())) {
                    try {
                        String base64 = template.getSignatureImageData();
                        if (base64.contains(",")) base64 = base64.split(",")[1];
                        byte[] imgBytes = Base64.getDecoder().decode(base64);
                        PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, imgBytes, "signature");
                        float imgW = 120;
                        float imgH = imgW * pdImage.getHeight() / pdImage.getWidth();
                        float sigX = (w - imgW) / 2;
                        float sigY = 120;
                        cs.drawImage(pdImage, sigX, sigY, imgW, imgH);

                        // Signature label below image
                        if (template.getSignatureLabel() != null && !template.getSignatureLabel().isBlank()) {
                            PDType1Font labelFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                            String labelText = replacePlaceholders(template.getSignatureLabel(), placeholders);
                            cs.beginText();
                            cs.setFont(labelFont, 10);
                            cs.setNonStrokingColor(new Color(100, 100, 100));
                            float lw = labelFont.getStringWidth(labelText) / 1000 * 10;
                            cs.newLineAtOffset((w - lw) / 2, sigY - 14);
                            cs.showText(labelText);
                            cs.endText();
                        }
                    } catch (Exception e) {
                        log.warn("Could not render signature image", e);
                    }
                }

                // Seal / ornament at bottom
                if (!"minimalista".equals(preset)) {
                    float sealR = "diplomatico".equals(preset) ? 28 : 22;
                    float sealY = 90;
                    if (template.getSignatureImageData() != null && !template.getSignatureImageData().isBlank()
                            && !"none".equals(template.getSignatureType())) {
                        sealY = 55;
                    }
                    drawSeal(cs, w / 2, sealY, sealR, parseColor("#0b2138"), parseColor("#c8962e"), preset);
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate certificate", e);
            throw new RuntimeException("Failed to generate certificate", e);
        }
    }

    private byte[] generateDiplomaCertificate(CertificateTemplate template, Student student,
                                               Map<String, String> placeholders, List<String> bodyLines,
                                               Map<String, Object> style) {
        int headerFontSize = ((Number) style.getOrDefault("headerFontSize", 42)).intValue();
        String headerColor = (String) style.getOrDefault("headerColor", "#1a3a6b");
        int bodyFontSize = ((Number) style.getOrDefault("bodyFontSize", 14)).intValue();
        String bodyColor = (String) style.getOrDefault("bodyColor", "#2c2c2c");
        String alignment = (String) style.getOrDefault("alignment", "center");

        try (PDDocument doc = new PDDocument()) {
            // Landscape A4
            PDPage page = new PDPage(new PDRectangle(PDRectangle.A4.getHeight(), PDRectangle.A4.getWidth()));
            doc.addPage(page);

            float w = page.getMediaBox().getWidth();
            float h = page.getMediaBox().getHeight();
            float margin = 80;
            float contentWidth = w - 2 * margin;

            try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                // Background: warm ivory/cream
                cs.setNonStrokingColor(new Color(253, 248, 240));
                cs.addRect(0, 0, w, h);
                cs.fill();

                // === Elaborate decorative frame ===
                // Outer thick navy
                cs.setStrokingColor(parseColor("#1a3a6b"));
                cs.setLineWidth(5);
                cs.addRect(30, 30, w - 60, h - 60);
                cs.stroke();

                // Gold line
                cs.setStrokingColor(parseColor("#c8962e"));
                cs.setLineWidth(2);
                cs.addRect(40, 40, w - 80, h - 80);
                cs.stroke();

                // Inner thin navy
                cs.setStrokingColor(parseColor("#1a3a6b"));
                cs.setLineWidth(1);
                cs.addRect(52, 52, w - 104, h - 104);
                cs.stroke();

                // Corner flourishes (decorative nested squares with rotated crosses)
                drawDiplomaCorner(cs, 52, h - 52, true, true, 18);
                drawDiplomaCorner(cs, w - 52, h - 52, true, false, 18);
                drawDiplomaCorner(cs, 52, 52, false, true, 18);
                drawDiplomaCorner(cs, w - 52, 52, false, false, 18);

                float y = h - 100;

                // === Institution placeholder ===
                PDType1Font instFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                cs.beginText();
                cs.setFont(instFont, 11);
                cs.setNonStrokingColor(new Color(80, 80, 80));
                String instText = "INSTITUCION EDUCATIVA";
                float iw = instFont.getStringWidth(instText) / 1000 * 11;
                cs.newLineAtOffset((w - iw) / 2, y);
                cs.showText(instText);
                cs.endText();
                y -= 32;

                // === Main title "DIPLOMA" ===
                String headerText = replacePlaceholders(template.getHeaderText() != null ? template.getHeaderText() : "DIPLOMA", placeholders);
                PDType1Font titleFont = new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
                cs.beginText();
                cs.setFont(titleFont, headerFontSize);
                cs.setNonStrokingColor(parseColor(headerColor));
                float tw = titleFont.getStringWidth(headerText) / 1000 * headerFontSize;
                cs.newLineAtOffset((w - tw) / 2, y);
                cs.showText(headerText);
                cs.endText();
                y -= headerFontSize + 16;

                // Ornamental line under title
                drawDiplomaOrnamentalLine(cs, w / 2, y + 8, 160, parseColor("#c8962e"));
                y -= 22;

                // === "Otorgado a" ===
                PDType1Font otorgadoFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
                cs.beginText();
                cs.setFont(otorgadoFont, 14);
                cs.setNonStrokingColor(new Color(100, 100, 100));
                String otorgado = "Otorgado a";
                float ow = otorgadoFont.getStringWidth(otorgado) / 1000 * 14;
                cs.newLineAtOffset((w - ow) / 2, y);
                cs.showText(otorgado);
                cs.endText();
                y -= 26;

                // === Student name (large, elegant) ===
                String studentName = replacePlaceholders("{{STUDENT_NAME}}", placeholders);
                PDType1Font nameFont = new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
                int nameSize = 32;
                cs.beginText();
                cs.setFont(nameFont, nameSize);
                cs.setNonStrokingColor(parseColor("#1a3a6b"));
                float nw = nameFont.getStringWidth(studentName) / 1000 * nameSize;
                cs.newLineAtOffset((w - nw) / 2, y);
                cs.showText(studentName);
                cs.endText();
                y -= nameSize + 20;

                // Line under name
                drawDiplomaOrnamentalLine(cs, w / 2, y + 8, 140, parseColor("#c8962e"));
                y -= 24;

                // === Recognition text (body lines) ===
                PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                PDType1Font bodyBold = new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
                cs.setNonStrokingColor(parseColor(bodyColor));

                for (String line : bodyLines) {
                    if (line == null || line.isBlank()) {
                        y -= bodyFontSize + 6;
                        continue;
                    }
                    String replaced = replacePlaceholders(line, placeholders);
                    if (replaced.isBlank()) continue;

                    List<String> wrapped = wrapText(replaced, contentWidth, bodyFontSize, bodyFont);
                    for (String wl : wrapped) {
                        boolean isDynamic = wl.contains("{{");
                        PDType1Font cf = isDynamic ? bodyBold : bodyFont;
                        cs.beginText();
                        cs.setFont(cf, bodyFontSize);
                        float textWidth = cf.getStringWidth(wl) / 1000 * bodyFontSize;
                        float x = computeX(alignment, margin, w, textWidth);
                        cs.newLineAtOffset(x, y);
                        cs.showText(wl);
                        cs.endText();
                        y -= bodyFontSize + 6;
                    }
                    y -= 4;
                }

                // === Date and place ===
                y -= 10;
                if (template.getFooterText() != null && !template.getFooterText().isBlank()) {
                    String footerText = replacePlaceholders(template.getFooterText(), placeholders);
                    PDType1Font footFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                    String[] footerLines = footerText.split("\\n");
                    for (String fl : footerLines) {
                        if (fl == null || fl.isBlank()) continue;
                        cs.beginText();
                        cs.setFont(footFont, 11);
                        cs.setNonStrokingColor(new Color(100, 100, 100));
                        float fw = footFont.getStringWidth(fl) / 1000 * 11;
                        cs.newLineAtOffset((w - fw) / 2, y);
                        cs.showText(fl);
                        cs.endText();
                        y -= 16;
                    }
                } else {
                    // Default date
                    PDType1Font dateFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                    String dateText = "Fecha: " + placeholders.getOrDefault("DATE", "");
                    cs.beginText();
                    cs.setFont(dateFont, 11);
                    cs.setNonStrokingColor(new Color(100, 100, 100));
                    float dw = dateFont.getStringWidth(dateText) / 1000 * 11;
                    cs.newLineAtOffset((w - dw) / 2, y);
                    cs.showText(dateText);
                    cs.endText();
                    y -= 16;
                }

                // === Two signature lines at bottom ===
                y = Math.max(y, 110);
                float sigLineWidth = 180;
                float leftX = w / 2 - sigLineWidth - 40;
                float rightX = w / 2 + 40;
                float lineY = 90;

                // Left signature line
                cs.setStrokingColor(parseColor("#1a3a6b"));
                cs.setLineWidth(1);
                cs.moveTo(leftX, lineY);
                cs.lineTo(leftX + sigLineWidth, lineY);
                cs.stroke();

                PDType1Font sigLabelFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                String leftLabel = template.getSignatureLabel() != null && !template.getSignatureLabel().isBlank()
                        ? replacePlaceholders(template.getSignatureLabel(), placeholders)
                        : "Director(a) Academico(a)";
                cs.beginText();
                cs.setFont(sigLabelFont, 10);
                cs.setNonStrokingColor(new Color(100, 100, 100));
                float lw = sigLabelFont.getStringWidth(leftLabel) / 1000 * 10;
                cs.newLineAtOffset(leftX + (sigLineWidth - lw) / 2, lineY - 14);
                cs.showText(leftLabel);
                cs.endText();

                // Right signature line
                cs.setStrokingColor(parseColor("#1a3a6b"));
                cs.setLineWidth(1);
                cs.moveTo(rightX, lineY);
                cs.lineTo(rightX + sigLineWidth, lineY);
                cs.stroke();

                String rightLabel = template.getSignatureLabel2() != null && !template.getSignatureLabel2().isBlank()
                        ? replacePlaceholders(template.getSignatureLabel2(), placeholders)
                        : "Coordinador(a) / Representante";
                cs.beginText();
                cs.setFont(sigLabelFont, 10);
                cs.setNonStrokingColor(new Color(100, 100, 100));
                float rw = sigLabelFont.getStringWidth(rightLabel) / 1000 * 10;
                cs.newLineAtOffset(rightX + (sigLineWidth - rw) / 2, lineY - 14);
                cs.showText(rightLabel);
                cs.endText();

                // Signature 1 (left line)
                if (template.getSignatureImageData() != null && !template.getSignatureImageData().isBlank()
                        && !"none".equals(template.getSignatureType())) {
                    try {
                        String base64 = template.getSignatureImageData();
                        if (base64.contains(",")) base64 = base64.split(",")[1];
                        byte[] imgBytes = Base64.getDecoder().decode(base64);
                        PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, imgBytes, "signature");
                        float imgW = 100;
                        float imgH = imgW * pdImage.getHeight() / pdImage.getWidth();
                        float imgX = leftX + (sigLineWidth - imgW) / 2;
                        float imgY = lineY + 4;
                        cs.drawImage(pdImage, imgX, imgY, imgW, imgH);
                    } catch (Exception e) {
                        log.warn("Could not render signature image on diploma (left)", e);
                    }
                }

                // Signature 2 (right line)
                if (template.getSignatureImageData2() != null && !template.getSignatureImageData2().isBlank()
                        && !"none".equals(template.getSignatureType2())) {
                    try {
                        String base64 = template.getSignatureImageData2();
                        if (base64.contains(",")) base64 = base64.split(",")[1];
                        byte[] imgBytes = Base64.getDecoder().decode(base64);
                        PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, imgBytes, "signature2");
                        float imgW = 100;
                        float imgH = imgW * pdImage.getHeight() / pdImage.getWidth();
                        float imgX = rightX + (sigLineWidth - imgW) / 2;
                        float imgY = lineY + 4;
                        cs.drawImage(pdImage, imgX, imgY, imgW, imgH);
                    } catch (Exception e) {
                        log.warn("Could not render signature image on diploma (right)", e);
                    }
                }
            }

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            doc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to generate diploma certificate", e);
            throw new RuntimeException("Failed to generate diploma certificate", e);
        }
    }

    private byte[] generatePdfBasedCertificate(CertificateTemplate template, Student student,
                                                Map<String, String> placeholders, List<String> bodyLines,
                                                Map<String, Object> style) {
        String preset = (String) style.getOrDefault("preset", "");
        String baseResource = template.getBasePdfResource();
        CertificateBasePreset.Config config = null;

        if (baseResource != null && !baseResource.isBlank()) {
            config = CertificateBasePreset.CONFIGS.get(baseResource);
        }
        if (config == null && CertificateBasePreset.isPdfPreset(preset)) {
            config = CertificateBasePreset.CONFIGS.get(preset);
        }
        if (config == null) {
            throw new IllegalStateException("No PDF base config found for preset/resource: " + preset + "/" + baseResource);
        }

        try (InputStream is = new ClassPathResource(config.getResourcePath()).getInputStream();
             PDDocument baseDoc = Loader.loadPDF(is.readAllBytes())) {

            PDPage basePage = baseDoc.getPage(0);
            PDRectangle mediaBox = basePage.getMediaBox();
            float w = mediaBox.getWidth();
            float h = mediaBox.getHeight();

            // Render base PDF page to image at 200 DPI for high quality
            PDFRenderer renderer = new PDFRenderer(baseDoc);
            BufferedImage bgImage = renderer.renderImageWithDPI(0, 200);

            try (PDDocument doc = new PDDocument()) {
                PDPage page = new PDPage(new PDRectangle(w, h));
                doc.addPage(page);

                try (PDPageContentStream cs = new PDPageContentStream(doc, page)) {
                    // Draw background image (compress as JPEG to keep file size reasonable)
                    PDImageXObject bgPdImage = JPEGFactory.createFromImage(doc, bgImage, 0.9f);
                    cs.drawImage(bgPdImage, 0, 0, w, h);

                    // Build field positions from template override or use defaults
                    Map<String, CertificateBasePreset.FieldConfig> fields = new java.util.HashMap<>(config.getFields());
                    if (template.getFieldPositionsJson() != null && !template.getFieldPositionsJson().isBlank()) {
                        try {
                            Map<String, Object> overrides = objectMapper.readValue(template.getFieldPositionsJson(), new TypeReference<Map<String, Object>>() {});
                            for (Map.Entry<String, Object> entry : overrides.entrySet()) {
                                if (entry.getValue() instanceof Map) {
                                    Map<String, Object> ov = (Map<String, Object>) entry.getValue();
                                    CertificateBasePreset.FieldConfig base = fields.get(entry.getKey());
                                    if (base == null) continue;
                                    float nx = ov.containsKey("x") ? ((Number) ov.get("x")).floatValue() : base.getX();
                                    float ny = ov.containsKey("y") ? ((Number) ov.get("y")).floatValue() : base.getY();
                                    float nSize = ov.containsKey("fontSize") ? ((Number) ov.get("fontSize")).floatValue() : base.getFontSize();
                                    String nColor = ov.containsKey("color") ? (String) ov.get("color") : base.getColor();
                                    String nAlign = ov.containsKey("alignment") ? (String) ov.get("alignment") : base.getAlignment();
                                    float nWidth = ov.containsKey("maxWidth") ? ((Number) ov.get("maxWidth")).floatValue() : base.getMaxWidth();
                                    boolean nBold = ov.containsKey("bold") ? Boolean.TRUE.equals(ov.get("bold")) : base.isBold();
                                    fields.put(entry.getKey(), new CertificateBasePreset.FieldConfig(nx, ny, nSize, nColor, nAlign, nWidth, nBold));
                                }
                            }
                        } catch (Exception e) {
                            log.warn("Invalid fieldPositionsJson, using defaults", e);
                        }
                    }

                    // Helper to draw text at field config
                    java.util.function.BiConsumer<String, String> drawField = (fieldKey, text) -> {
                        if (text == null || text.isBlank()) return;
                        CertificateBasePreset.FieldConfig fc = fields.get(fieldKey);
                        if (fc == null) return;
                        try {
                            String replaced = replacePlaceholders(text, placeholders);
                            if (replaced.isBlank()) return;
                            PDType1Font font = fc.isBold()
                                    ? new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD)
                                    : new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                            Color color = parseColor(fc.getColor());
                            float fontSize = fc.getFontSize();
                            float maxWidth = fc.getMaxWidth();
                            List<String> wrapped = wrapText(replaced, maxWidth, fontSize, font);
                            float y = fc.getY();
                            for (String line : wrapped) {
                                float tw = font.getStringWidth(line) / 1000 * fontSize;
                                float x = fc.getX();
                                if ("center".equals(fc.getAlignment())) {
                                    x = x - tw / 2;
                                } else if ("right".equals(fc.getAlignment())) {
                                    x = x - tw;
                                }
                                cs.beginText();
                                cs.setFont(font, fontSize);
                                cs.setNonStrokingColor(color);
                                cs.newLineAtOffset(x, y);
                                cs.showText(line);
                                cs.endText();
                                y -= fontSize + 4;
                            }
                        } catch (Exception ex) {
                            log.warn("Failed to draw field " + fieldKey, ex);
                        }
                    };

                    // Draw fields
                    drawField.accept("header", template.getHeaderText());
                    drawField.accept("subtitle", template.getSubtitleText());
                    drawField.accept("studentName", "{{STUDENT_NAME}}");

                    // Body lines
                    CertificateBasePreset.FieldConfig bodyConfig = fields.get("body");
                    if (bodyConfig != null) {
                        float bodyY = bodyConfig.getY();
                        for (String line : bodyLines) {
                            if (line == null || line.isBlank()) {
                                bodyY -= bodyConfig.getFontSize() + 6;
                                continue;
                            }
                            String replaced = replacePlaceholders(line, placeholders);
                            if (replaced.isBlank()) continue;
                            PDType1Font bodyFont = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                            List<String> wrapped = wrapText(replaced, bodyConfig.getMaxWidth(), bodyConfig.getFontSize(), bodyFont);
                            for (String wl : wrapped) {
                                try {
                                    float tw = bodyFont.getStringWidth(wl) / 1000 * bodyConfig.getFontSize();
                                    float x = bodyConfig.getX();
                                    if ("center".equals(bodyConfig.getAlignment())) x = x - tw / 2;
                                    else if ("right".equals(bodyConfig.getAlignment())) x = x - tw;
                                    cs.beginText();
                                    cs.setFont(bodyFont, bodyConfig.getFontSize());
                                    cs.setNonStrokingColor(parseColor(bodyConfig.getColor()));
                                    cs.newLineAtOffset(x, bodyY);
                                    cs.showText(wl);
                                    cs.endText();
                                    bodyY -= bodyConfig.getFontSize() + 4;
                                } catch (Exception ex) {
                                    log.warn("Body line draw error", ex);
                                }
                            }
                            bodyY -= 4;
                        }
                    }

                    drawField.accept("footer", template.getFooterText());
                    drawField.accept("signature1", template.getSignatureLabel());
                    drawField.accept("signature2", template.getSignatureLabel2());

                    // Signature images
                    drawSignatureImageOnPdf(doc, cs, template.getSignatureImageData(), template.getSignatureType(), fields.get("signature1"));
                    drawSignatureImageOnPdf(doc, cs, template.getSignatureImageData2(), template.getSignatureType2(), fields.get("signature2"));
                }

                ByteArrayOutputStream baos = new ByteArrayOutputStream();
                doc.save(baos);
                return baos.toByteArray();
            }
        } catch (Exception e) {
            log.error("Failed to generate PDF-based certificate", e);
            throw new RuntimeException("Failed to generate PDF-based certificate", e);
        }
    }

    private byte[] generateDocxBasedCertificate(CertificateTemplate template, Student student, Map<String, String> placeholders) {
        String html = template.getEditableHtml();
        if (html == null || html.isBlank()) {
            // If no editable HTML yet, generate from base docx
            if (template.getBaseDocxResource() != null && !template.getBaseDocxResource().isBlank()) {
                try (InputStream is = new ClassPathResource("certificate-bases/" + template.getBaseDocxResource() + ".docx").getInputStream()) {
                    html = docxToHtmlConverter.convert(is);
                } catch (Exception e) {
                    log.error("Failed to convert base docx to html", e);
                    throw new RuntimeException("Failed to convert base docx to html", e);
                }
            } else {
                throw new IllegalStateException("No editable HTML or base DOCX resource available");
            }
        }
        return htmlToPdfRenderer.render(
                html, placeholders,
                template.getSignatureImageData(), template.getSignatureType(), template.getSignatureLabel(),
                template.getSignatureImageData2(), template.getSignatureType2(), template.getSignatureLabel2()
        );
    }

    private void drawSignatureImageOnPdf(PDDocument doc, PDPageContentStream cs, String imageData, String sigType, CertificateBasePreset.FieldConfig fieldConfig) {
        if (imageData == null || imageData.isBlank() || "none".equals(sigType) || fieldConfig == null) return;
        try {
            String base64 = imageData;
            if (base64.contains(",")) base64 = base64.split(",")[1];
            byte[] imgBytes = Base64.getDecoder().decode(base64);
            PDImageXObject pdImage = PDImageXObject.createFromByteArray(doc, imgBytes, "signature");
            float imgW = 90;
            float imgH = imgW * pdImage.getHeight() / pdImage.getWidth();
            float x = fieldConfig.getX();
            if ("center".equals(fieldConfig.getAlignment())) {
                x = x - imgW / 2;
            } else if ("right".equals(fieldConfig.getAlignment())) {
                x = x - imgW;
            }
            float imgY = fieldConfig.getY() + 8;
            cs.drawImage(pdImage, x, imgY, imgW, imgH);
        } catch (Exception e) {
            log.warn("Could not render signature image on PDF base", e);
        }
    }

    private void drawDiplomaCorner(PDPageContentStream cs, float cx, float cy, boolean top, boolean left, float size) throws java.io.IOException {
        int signX = left ? 1 : -1;
        int signY = top ? -1 : 1;
        cs.setStrokingColor(parseColor("#c8962e"));
        cs.setLineWidth(1.5f);
        // Outer L-shape
        cs.moveTo(cx, cy + signY * size);
        cs.lineTo(cx, cy);
        cs.lineTo(cx + signX * size, cy);
        cs.stroke();
        // Inner smaller L
        float s2 = size * 0.6f;
        cs.setLineWidth(0.8f);
        cs.moveTo(cx, cy + signY * s2);
        cs.lineTo(cx, cy);
        cs.lineTo(cx + signX * s2, cy);
        cs.stroke();
        // Small filled square at corner
        cs.setNonStrokingColor(parseColor("#1a3a6b"));
        float sq = 5;
        cs.addRect(cx + (left ? 0 : -sq), cy + (top ? -sq : 0), sq, sq);
        cs.fill();
    }

    private void drawDiplomaOrnamentalLine(PDPageContentStream cs, float cx, float y, float totalWidth, Color color) throws java.io.IOException {
        cs.setStrokingColor(color);
        cs.setLineWidth(1.2f);
        float half = totalWidth / 2;
        // Main line
        cs.moveTo(cx - half, y);
        cs.lineTo(cx + half, y);
        cs.stroke();
        // Center diamond
        cs.setNonStrokingColor(color);
        float d = 6;
        cs.moveTo(cx, y + d);
        cs.lineTo(cx + d, y);
        cs.lineTo(cx, y - d);
        cs.lineTo(cx - d, y);
        cs.closePath();
        cs.fill();
        // Small dots near ends
        float r = 3;
        for (float dx : new float[]{-half + 10, half - 10}) {
            cs.moveTo(cx + dx + r, y);
            for (int i = 1; i <= 20; i++) {
                double a = 2 * Math.PI * i / 20;
                cs.lineTo((float)(cx + dx + r * Math.cos(a)), (float)(y + r * Math.sin(a)));
            }
            cs.closePath();
            cs.fill();
        }
    }

    private void drawBackgroundByPreset(PDPageContentStream cs, float w, float h, String preset) throws java.io.IOException {
        switch (preset) {
            case "moderno" -> {
                cs.setNonStrokingColor(Color.WHITE);
                cs.addRect(0, 0, w, h);
                cs.fill();
                cs.setStrokingColor(parseColor("#0b2138"));
                cs.setLineWidth(2);
                cs.addRect(40, 40, w - 80, h - 80);
                cs.stroke();
                cs.setStrokingColor(parseColor("#c8962e"));
                cs.setLineWidth(0.8f);
                cs.addRect(48, 48, w - 96, h - 96);
                cs.stroke();
            }
            case "minimalista" -> {
                cs.setNonStrokingColor(Color.WHITE);
                cs.addRect(0, 0, w, h);
                cs.fill();
            }
            case "diplomatico" -> {
                cs.setNonStrokingColor(new Color(250, 245, 235));
                cs.addRect(0, 0, w, h);
                cs.fill();
                cs.setStrokingColor(parseColor("#1a3a6b"));
                cs.setLineWidth(5);
                cs.addRect(28, 28, w - 56, h - 56);
                cs.stroke();
                cs.setStrokingColor(parseColor("#1a3a6b"));
                cs.setLineWidth(1.5f);
                cs.addRect(40, 40, w - 80, h - 80);
                cs.stroke();
                float cornerSize = 14;
                float[][] corners = {
                    {40, h - 40 - cornerSize},
                    {w - 40 - cornerSize, h - 40 - cornerSize},
                    {40, 40},
                    {w - 40 - cornerSize, 40}
                };
                cs.setNonStrokingColor(parseColor("#c8962e"));
                for (float[] c : corners) {
                    cs.addRect(c[0], c[1], cornerSize, cornerSize);
                    cs.fill();
                }
            }
            default -> { // clasico
                cs.setNonStrokingColor(new Color(252, 248, 240));
                cs.addRect(0, 0, w, h);
                cs.fill();
                cs.setStrokingColor(parseColor("#0b2138"));
                cs.setLineWidth(4);
                cs.addRect(30, 30, w - 60, h - 60);
                cs.stroke();
                cs.setStrokingColor(parseColor("#c8962e"));
                cs.setLineWidth(1.2f);
                cs.addRect(38, 38, w - 76, h - 76);
                cs.stroke();
                cs.setStrokingColor(parseColor("#0b2138"));
                cs.setLineWidth(0.8f);
                cs.addRect(46, 46, w - 92, h - 92);
                cs.stroke();
                float cornerSize = 10;
                float[][] corners = {
                    {46, h - 46 - cornerSize},
                    {w - 46 - cornerSize, h - 46 - cornerSize},
                    {46, 46},
                    {w - 46 - cornerSize, 46}
                };
                cs.setNonStrokingColor(parseColor("#c8962e"));
                for (float[] c : corners) {
                    cs.addRect(c[0], c[1], cornerSize, cornerSize);
                    cs.fill();
                }
            }
        }
    }

    private float computeX(String alignment, float margin, float w, float textWidth) {
        if ("left".equals(alignment)) return margin;
        if ("right".equals(alignment)) return w - margin - textWidth;
        return (w - textWidth) / 2;
    }

    private void drawOrnamentalLine(PDPageContentStream cs, float cx, float y, float totalWidth, Color color, String preset) throws java.io.IOException {
        if ("moderno".equals(preset)) {
            cs.setStrokingColor(color);
            cs.setLineWidth(0.8f);
            cs.moveTo(cx - totalWidth / 2, y);
            cs.lineTo(cx + totalWidth / 2, y);
            cs.stroke();
            return;
        }
        cs.setStrokingColor(color);
        cs.setLineWidth(1.2f);
        float half = totalWidth / 2;
        cs.moveTo(cx - half - 14, y);
        cs.lineTo(cx - 14, y);
        cs.stroke();
        cs.setNonStrokingColor(color);
        float d = 5;
        cs.moveTo(cx, y + d);
        cs.lineTo(cx + d, y);
        cs.lineTo(cx, y - d);
        cs.lineTo(cx - d, y);
        cs.closePath();
        cs.fill();
        cs.setStrokingColor(color);
        cs.moveTo(cx + 14, y);
        cs.lineTo(cx + half + 14, y);
        cs.stroke();
    }

    private void drawSeal(PDPageContentStream cs, float cx, float cy, float r, Color outerColor, Color innerColor, String preset) throws java.io.IOException {
        float steps = 60;
        cs.setStrokingColor(outerColor);
        cs.setLineWidth("diplomatico".equals(preset) ? 2.5f : 2);
        cs.moveTo(cx + r, cy);
        for (int i = 1; i <= steps; i++) {
            double angle = 2 * Math.PI * i / steps;
            cs.lineTo((float)(cx + r * Math.cos(angle)), (float)(cy + r * Math.sin(angle)));
        }
        cs.closePath();
        cs.stroke();

        float r2 = r - 5;
        cs.setStrokingColor(innerColor);
        cs.setLineWidth(0.8f);
        cs.moveTo(cx + r2, cy);
        for (int i = 1; i <= steps; i++) {
            double angle = 2 * Math.PI * i / steps;
            cs.lineTo((float)(cx + r2 * Math.cos(angle)), (float)(cy + r2 * Math.sin(angle)));
        }
        cs.closePath();
        cs.stroke();

        cs.setNonStrokingColor(innerColor);
        float starR = "diplomatico".equals(preset) ? 8 : 6;
        int points = 5;
        cs.moveTo(cx, cy + starR);
        for (int i = 1; i < points * 2; i++) {
            double angle = Math.PI / 2 + Math.PI * i / points;
            float radius = (i % 2 == 0) ? starR : starR / 2.5f;
            cs.lineTo((float)(cx + radius * Math.cos(angle)), (float)(cy + radius * Math.sin(angle)));
        }
        cs.closePath();
        cs.fill();
    }

    private Map<String, String> buildPlaceholders(Student student) {
        Map<String, String> map = new java.util.HashMap<>();
        map.put("STUDENT_NAME", student.getUser() != null ? student.getUser().getName() : "");
        map.put("STUDENT_CODE", student.getStudentCode() != null ? student.getStudentCode() : "");
        map.put("STUDENT_EMAIL", student.getUser() != null ? student.getUser().getEmail() : "");
        map.put("DATE", LocalDateTime.now().format(DateTimeFormatter.ofPattern("dd/MM/yyyy")));
        map.put("GRADE_NAME", getStudentGradeName(student));
        map.put("LEVEL_NAME", getStudentLevelName(student));
        map.put("COURSE_NAME", getStudentCourseName(student));
        map.put("TEACHER_NAME", getStudentTeacherName(student));
        map.put("AVERAGE_GRADE", getStudentAverageGrade(student));
        return map;
    }

    private String replacePlaceholders(String text, Map<String, String> placeholders) {
        String result = text;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            result = result.replace("{{" + entry.getKey() + "}}", entry.getValue() != null ? entry.getValue() : "");
        }
        return result;
    }

    private List<String> wrapText(String text, float maxWidth, float fontSize, PDType1Font font) {
        List<String> lines = new java.util.ArrayList<>();
        if (text == null || text.isEmpty()) return lines;

        String[] words = text.split(" ");
        StringBuilder currentLine = new StringBuilder();

        for (String word : words) {
            String test = currentLine.length() > 0 ? currentLine + " " + word : word;
            try {
                float width = font.getStringWidth(test) / 1000 * fontSize;
                if (width > maxWidth && currentLine.length() > 0) {
                    lines.add(currentLine.toString());
                    currentLine = new StringBuilder(word);
                } else {
                    currentLine = new StringBuilder(test);
                }
            } catch (java.io.IOException e) {
                currentLine = new StringBuilder(test);
            }
        }
        if (currentLine.length() > 0) {
            lines.add(currentLine.toString());
        }
        return lines;
    }

    private String getStudentGradeName(Student student) {
        try {
            String courseName = enrollmentRepository.findAll().stream()
                    .filter(e -> e.getStudent() != null && e.getStudent().getId().equals(student.getId()))
                    .findFirst()
                    .map(e -> e.getCourse() != null ? e.getCourse().getName() : "")
                    .orElse("");
            if (courseName.isBlank()) return "";
            // Heuristic: try to find an academic grade whose name appears in the course name
            String normalizedCourse = courseName.toUpperCase().replaceAll("[^A-Z0-9]", " ");
            for (AcademicGrade ag : academicGradeRepository.findAll()) {
                if (ag.getName() != null && normalizedCourse.contains(ag.getName().toUpperCase())) {
                    return ag.getName();
                }
            }
            return courseName;
        } catch (Exception e) { return ""; }
    }

    private String getStudentLevelName(Student student) {
        try {
            String gradeName = getStudentGradeName(student);
            if (gradeName.isBlank()) return "";
            for (AcademicGrade ag : academicGradeRepository.findAll()) {
                if (ag.getName() != null && ag.getName().equalsIgnoreCase(gradeName) && ag.getLevel() != null) {
                    return ag.getLevel().getName();
                }
            }
            return "";
        } catch (Exception e) { return ""; }
    }

    private String getStudentCourseName(Student student) {
        try {
            return enrollmentRepository.findAll().stream()
                    .filter(e -> e.getStudent() != null && e.getStudent().getId().equals(student.getId()))
                    .findFirst()
                    .map(e -> e.getCourse() != null ? e.getCourse().getName() : "")
                    .orElse("");
        } catch (Exception e) { return ""; }
    }

    private String getStudentTeacherName(Student student) {
        try {
            return enrollmentRepository.findAll().stream()
                    .filter(e -> e.getStudent() != null && e.getStudent().getId().equals(student.getId()))
                    .findFirst()
                    .map(e -> {
                        if (e.getCourse() == null || e.getCourse().getTeacher() == null) return "";
                        User u = e.getCourse().getTeacher().getUser();
                        return u != null ? u.getName() : "";
                    })
                    .orElse("");
        } catch (Exception e) { return ""; }
    }

    private String getStudentAverageGrade(Student student) {
        try {
            List<Grade> grades = gradeRepository.findAll().stream()
                    .filter(g -> g.getStudent() != null && g.getStudent().getId().equals(student.getId()) && g.getGrade() != null)
                    .toList();
            if (grades.isEmpty()) return "";
            double avg = grades.stream().mapToDouble(g -> g.getGrade().doubleValue()).average().orElse(0.0);
            return String.format(java.util.Locale.US, "%.1f", avg);
        } catch (Exception e) { return ""; }
    }

    private Color parseColor(String hex) {
        if (hex == null || hex.isBlank()) return Color.BLACK;
        try {
            return Color.decode(hex.startsWith("#") ? hex : "#" + hex);
        } catch (NumberFormatException e) {
            return Color.BLACK;
        }
    }

    @Override
    public Map<String, Object> massGenerate(Integer templateId, List<Integer> studentIds) {
        CertificateTemplate template = templateRepository.findById(templateId)
                .orElseThrow(() -> new EntityNotFoundException("Template not found: " + templateId));

        List<Student> students;
        if (studentIds != null && !studentIds.isEmpty()) {
            students = studentRepository.findAllById(studentIds);
        } else {
            students = studentRepository.findAll();
        }

        Map<String, Object> conditions = new HashMap<>();
        if (template.getConditionsJson() != null && !template.getConditionsJson().isBlank()) {
            try {
                conditions = objectMapper.readValue(template.getConditionsJson(), new TypeReference<Map<String, Object>>() {});
            } catch (Exception e) {
                log.warn("Invalid conditions JSON", e);
            }
        }

        int created = 0;
        int skipped = 0;
        int failed = 0;
        List<Map<String, String>> details = new ArrayList<>();

        for (Student student : students) {
            boolean passes = evaluateConditions(student, conditions);
            if (!passes) {
                skipped++;
                details.add(Map.of("studentId", String.valueOf(student.getId()), "status", "skipped", "reason", "No cumple condiciones"));
                continue;
            }
            try {
                byte[] docxBytes = generateDocx(templateId, student.getId());
                String base64 = Base64.getEncoder().encodeToString(docxBytes);
                Certificate certificate = Certificate.builder()
                        .student(student)
                        .name(template.getName())
                        .filePath(base64)
                        .issuedAt(LocalDate.now())
                        .status("available")
                        .build();
                certificateRepository.save(certificate);
                created++;
                details.add(Map.of("studentId", String.valueOf(student.getId()), "status", "created"));
            } catch (Exception e) {
                failed++;
                log.error("Failed to generate certificate for student {}", student.getId(), e);
                details.add(Map.of("studentId", String.valueOf(student.getId()), "status", "failed", "reason", e.getMessage()));
            }
        }

        return Map.of(
                "created", created,
                "skipped", skipped,
                "failed", failed,
                "details", details
        );
    }

    private boolean evaluateConditions(Student student, Map<String, Object> conditions) {
        if (conditions == null || conditions.isEmpty()) return true;

        Object minAvg = conditions.get("minAverageGrade");
        if (minAvg != null && !String.valueOf(minAvg).isBlank()) {
            try {
                double min = Double.parseDouble(String.valueOf(minAvg));
                double avg = calculateStudentAverage(student);
                if (avg < min) return false;
            } catch (NumberFormatException e) {
                log.warn("Invalid minAverageGrade condition", e);
            }
        }

        boolean requirePassing = Boolean.TRUE.equals(conditions.get("passingAllPeriods"))
                || Boolean.TRUE.equals(conditions.get("passingAllUnits"))
                || Boolean.TRUE.equals(conditions.get("passingAllCuts"));
        if (requirePassing) {
            List<Grade> grades = gradeRepository.findAll().stream()
                    .filter(g -> g.getStudent() != null && g.getStudent().getId().equals(student.getId()) && g.getGrade() != null)
                    .toList();
            for (Grade g : grades) {
                if (g.getGrade().doubleValue() < 3.0) return false;
            }
        }

        return true;
    }

    private double calculateStudentAverage(Student student) {
        List<Grade> grades = gradeRepository.findAll().stream()
                .filter(g -> g.getStudent() != null && g.getStudent().getId().equals(student.getId()) && g.getGrade() != null)
                .toList();
        if (grades.isEmpty()) return 0.0;
        return grades.stream().mapToDouble(g -> g.getGrade().doubleValue()).average().orElse(0.0);
    }

    private CertificateTemplateResponse toResponse(CertificateTemplate t) {
        return CertificateTemplateResponse.builder()
                .id(t.getId())
                .name(t.getName())
                .description(t.getDescription())
                .headerText(t.getHeaderText())
                .subtitleText(t.getSubtitleText())
                .bodyLinesJson(t.getBodyLinesJson())
                .footerText(t.getFooterText())
                .styleConfigJson(t.getStyleConfigJson())
                .conditionsJson(t.getConditionsJson())
                .signatureImageData(t.getSignatureImageData())
                .signatureType(t.getSignatureType())
                .signatureLabel(t.getSignatureLabel())
                .signatureImageData2(t.getSignatureImageData2())
                .signatureType2(t.getSignatureType2())
                .signatureLabel2(t.getSignatureLabel2())
                .basePdfResource(t.getBasePdfResource())
                .baseDocxResource(t.getBaseDocxResource())
                .editableHtml(t.getEditableHtml())
                .fieldPositionsJson(t.getFieldPositionsJson())
                .docxFilePath(t.getDocxFilePath())
                .createdAt(t.getCreatedAt())
                .updatedAt(t.getUpdatedAt())
                .build();
    }
}
