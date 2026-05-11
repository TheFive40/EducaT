package com.github.net.educat.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.pdfbox.pdmodel.PDDocument;
import org.apache.pdfbox.pdmodel.PDPage;
import org.apache.pdfbox.pdmodel.PDPageContentStream;
import org.apache.pdfbox.pdmodel.common.PDRectangle;
import org.apache.pdfbox.pdmodel.font.PDType1Font;
import org.apache.pdfbox.pdmodel.font.Standard14Fonts;
import org.apache.pdfbox.pdmodel.graphics.image.PDImageXObject;
import org.jsoup.Jsoup;
import org.jsoup.nodes.Document;
import org.jsoup.nodes.Element;
import org.jsoup.nodes.Node;
import org.jsoup.nodes.TextNode;
import org.springframework.stereotype.Component;

import java.awt.Color;
import java.io.ByteArrayOutputStream;
import java.util.Base64;
import java.util.List;
import java.util.Map;

@Slf4j
@Component
public class HtmlToPdfRenderer {

    private static final float MARGIN = 60;
    private static final float PAGE_WIDTH = PDRectangle.A4.getHeight(); // Landscape A4 (842)
    private static final float PAGE_HEIGHT = PDRectangle.A4.getWidth();  // Landscape A4 (595)

    public byte[] render(String html, Map<String, String> placeholders,
                         String sig1Data, String sig1Type, String sig1Label,
                         String sig2Data, String sig2Type, String sig2Label) {
        // Replace dynamic field spans with actual values
        Document doc = Jsoup.parseBodyFragment(html != null ? html : "");
        for (Element fieldSpan : doc.select("span.cert-field")) {
            String fieldKey = fieldSpan.attr("data-field");
            if (fieldKey != null && !fieldKey.isBlank() && placeholders.containsKey(fieldKey)) {
                String val = placeholders.get(fieldKey);
                fieldSpan.text(val != null ? val : "");
            }
        }

        // Also replace raw {{PLACEHOLDER}} syntax if any
        String bodyHtml = doc.body().html();
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            String val = entry.getValue() != null ? entry.getValue() : "";
            bodyHtml = bodyHtml.replace("{{" + entry.getKey() + "}}", val);
        }
        Element body = Jsoup.parseBodyFragment(bodyHtml).body();

        try (PDDocument pdfDoc = new PDDocument()) {
            RenderContext ctx = new RenderContext();
            ctx.doc = pdfDoc;
            ctx.x = MARGIN;
            ctx.y = PAGE_HEIGHT - MARGIN;
            ctx.pageWidth = PAGE_WIDTH;
            ctx.pageHeight = PAGE_HEIGHT;
            ctx.margin = MARGIN;

            // Ensure first page exists
            ctx.ensurePageAndStream();

            for (Node child : body.childNodes()) {
                renderNode(ctx, child);
            }

            // Draw signatures
            drawSignatures(ctx, sig1Data, sig1Type, sig1Label, sig2Data, sig2Type, sig2Label);

            ctx.closeStream();

            ByteArrayOutputStream baos = new ByteArrayOutputStream();
            pdfDoc.save(baos);
            return baos.toByteArray();
        } catch (Exception e) {
            log.error("Failed to render HTML to PDF", e);
            throw new RuntimeException("Failed to render HTML to PDF", e);
        }
    }

    private void renderNode(RenderContext ctx, Node node) {
        if (node instanceof TextNode textNode) {
            String text = textNode.text();
            if (!text.isEmpty()) {
                writeText(ctx, text);
            }
        } else if (node instanceof Element element) {
            String tag = element.tagName().toLowerCase();
            switch (tag) {
                case "p", "div" -> renderBlockElement(ctx, element);
                case "span" -> renderInlineElement(ctx, element);
                case "br" -> ctx.y -= ctx.currentFontSize + 4;
                case "table" -> renderTable(ctx, element);
                case "img" -> renderImage(ctx, element);
                case "b", "strong" -> {
                    boolean oldBold = ctx.bold;
                    ctx.bold = true;
                    for (Node child : element.childNodes()) renderNode(ctx, child);
                    ctx.bold = oldBold;
                }
                case "i", "em" -> {
                    boolean oldItalic = ctx.italic;
                    ctx.italic = true;
                    for (Node child : element.childNodes()) renderNode(ctx, child);
                    ctx.italic = oldItalic;
                }
                case "u" -> {
                    boolean oldUnderline = ctx.underline;
                    ctx.underline = true;
                    for (Node child : element.childNodes()) renderNode(ctx, child);
                    ctx.underline = oldUnderline;
                }
                default -> {
                    for (Node child : element.childNodes()) renderNode(ctx, child);
                }
            }
        }
    }

    private void renderBlockElement(RenderContext ctx, Element element) {
        String style = element.attr("style");
        StyleBackup backup = applyStyle(ctx, style);

        String align = extractStyleValue(style, "text-align");
        String oldAlign = ctx.align;
        if (align != null) ctx.align = align;

        if (ctx.x > ctx.margin + 1) {
            ctx.y -= ctx.currentFontSize + 6;
            ctx.x = ctx.margin;
        }

        for (Node child : element.childNodes()) {
            renderNode(ctx, child);
        }

        ctx.y -= ctx.currentFontSize + 6;
        ctx.x = ctx.margin;

        ctx.align = oldAlign;
        restoreStyle(ctx, backup);
    }

    private void renderInlineElement(RenderContext ctx, Element element) {
        String style = element.attr("style");
        StyleBackup backup = applyStyle(ctx, style);

        for (Node child : element.childNodes()) {
            renderNode(ctx, child);
        }

        restoreStyle(ctx, backup);
    }

    private void writeText(RenderContext ctx, String text) {
        try {
            PDType1Font font = resolveFont(ctx);
            float fontSize = ctx.currentFontSize;
            Color color = ctx.currentColor;

            String[] words = text.split(" ");
            for (String word : words) {
                if (word.isEmpty()) continue;
                String toDraw = (ctx.x > ctx.margin) ? " " + word : word;
                float wordWidth = font.getStringWidth(toDraw) / 1000 * fontSize;

                if (ctx.x + wordWidth > ctx.pageWidth - ctx.margin) {
                    ctx.y -= fontSize + 4;
                    ctx.x = ctx.margin;
                    toDraw = word;
                    wordWidth = font.getStringWidth(toDraw) / 1000 * fontSize;
                }

                if (ctx.y < ctx.margin + fontSize) {
                    ctx.newPage();
                }

                ctx.cs.beginText();
                ctx.cs.setFont(font, fontSize);
                ctx.cs.setNonStrokingColor(color);
                ctx.cs.newLineAtOffset(ctx.x, ctx.y);
                ctx.cs.showText(toDraw);
                ctx.cs.endText();

                ctx.x += wordWidth;
            }
        } catch (Exception e) {
            log.warn("Text render error for: {}", text, e);
        }
    }

    private PDType1Font resolveFont(RenderContext ctx) {
        String family = ctx.fontFamily.toLowerCase();
        boolean bold = ctx.bold;
        boolean italic = ctx.italic;

        if (family.contains("times") || family.contains("serif")) {
            if (bold && italic) return new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD_ITALIC);
            if (bold) return new PDType1Font(Standard14Fonts.FontName.TIMES_BOLD);
            if (italic) return new PDType1Font(Standard14Fonts.FontName.TIMES_ITALIC);
            return new PDType1Font(Standard14Fonts.FontName.TIMES_ROMAN);
        }
        if (family.contains("courier") || family.contains("mono")) {
            if (bold && italic) return new PDType1Font(Standard14Fonts.FontName.COURIER_BOLD_OBLIQUE);
            if (bold) return new PDType1Font(Standard14Fonts.FontName.COURIER_BOLD);
            if (italic) return new PDType1Font(Standard14Fonts.FontName.COURIER_OBLIQUE);
            return new PDType1Font(Standard14Fonts.FontName.COURIER);
        }
        if (bold && italic) return new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD_OBLIQUE);
        if (bold) return new PDType1Font(Standard14Fonts.FontName.HELVETICA_BOLD);
        if (italic) return new PDType1Font(Standard14Fonts.FontName.HELVETICA_OBLIQUE);
        return new PDType1Font(Standard14Fonts.FontName.HELVETICA);
    }

    private StyleBackup applyStyle(RenderContext ctx, String style) {
        StyleBackup backup = new StyleBackup();
        backup.fontFamily = ctx.fontFamily;
        backup.fontSize = ctx.currentFontSize;
        backup.color = ctx.currentColor;
        backup.bold = ctx.bold;
        backup.italic = ctx.italic;
        backup.underline = ctx.underline;
        backup.align = ctx.align;

        String fontFamily = extractStyleValue(style, "font-family");
        if (fontFamily != null) {
            ctx.fontFamily = fontFamily.replace("'", "").replace("\"", "").split(",")[0].trim();
        }

        String fontSize = extractStyleValue(style, "font-size");
        if (fontSize != null) {
            try {
                ctx.currentFontSize = parseFontSize(fontSize);
            } catch (Exception ignored) {}
        }

        String color = extractStyleValue(style, "color");
        if (color != null) {
            ctx.currentColor = parseColor(color);
        }

        String weight = extractStyleValue(style, "font-weight");
        if (weight != null) {
            ctx.bold = weight.contains("bold") || weight.contains("700");
        }

        String fontStyle = extractStyleValue(style, "font-style");
        if (fontStyle != null) {
            ctx.italic = fontStyle.contains("italic") || fontStyle.contains("oblique");
        }

        String textDecoration = extractStyleValue(style, "text-decoration");
        if (textDecoration != null) {
            ctx.underline = textDecoration.contains("underline");
        }

        String align = extractStyleValue(style, "text-align");
        if (align != null) {
            ctx.align = align;
        }

        return backup;
    }

    private void restoreStyle(RenderContext ctx, StyleBackup backup) {
        ctx.fontFamily = backup.fontFamily;
        ctx.currentFontSize = backup.fontSize;
        ctx.currentColor = backup.color;
        ctx.bold = backup.bold;
        ctx.italic = backup.italic;
        ctx.underline = backup.underline;
        ctx.align = backup.align;
    }

    private float parseFontSize(String value) {
        value = value.trim().toLowerCase();
        if (value.endsWith("px")) {
            return Float.parseFloat(value.replace("px", "").trim());
        }
        if (value.endsWith("pt")) {
            return Float.parseFloat(value.replace("pt", "").trim());
        }
        if (value.endsWith("em")) {
            return Float.parseFloat(value.replace("em", "").trim()) * 12;
        }
        return Float.parseFloat(value);
    }

    private Color parseColor(String hex) {
        if (hex == null || hex.isBlank()) return Color.BLACK;
        try {
            hex = hex.trim();
            if (hex.startsWith("#")) hex = hex.substring(1);
            if (hex.length() == 3) {
                hex = "" + hex.charAt(0) + hex.charAt(0) + hex.charAt(1) + hex.charAt(1) + hex.charAt(2) + hex.charAt(2);
            }
            return new Color(Integer.parseInt(hex, 16));
        } catch (Exception e) {
            return Color.BLACK;
        }
    }

    private String extractStyleValue(String style, String property) {
        if (style == null || style.isBlank()) return null;
        String[] parts = style.split(";");
        for (String part : parts) {
            part = part.trim();
            if (part.toLowerCase().startsWith(property.toLowerCase() + ":")) {
                return part.substring(property.length() + 1).trim();
            }
        }
        return null;
    }

    private void renderTable(RenderContext ctx, Element table) {
        for (Element row : table.select("tr")) {
            for (Element cell : row.select("td,th")) {
                renderBlockElement(ctx, cell);
            }
        }
    }

    private void renderImage(RenderContext ctx, Element img) {
        String src = img.attr("src");
        if (src == null || src.isBlank()) return;
        try {
            if (src.startsWith("data:image")) {
                String base64 = src.contains(",") ? src.split(",")[1] : src;
                byte[] bytes = Base64.getDecoder().decode(base64);
                PDImageXObject pdImg = PDImageXObject.createFromByteArray(ctx.doc, bytes, "img");
                float w = 100;
                float h = pdImg.getHeight() * (w / pdImg.getWidth());
                if (ctx.y - h < ctx.margin) {
                    ctx.newPage();
                }
                ctx.cs.drawImage(pdImg, ctx.x, ctx.y - h, w, h);
                ctx.y -= h + 10;
            }
        } catch (Exception e) {
            log.warn("Image render error", e);
        }
    }

    private void drawSignatures(RenderContext ctx, String sig1Data, String sig1Type, String sig1Label,
                                String sig2Data, String sig2Type, String sig2Label) {
        float lineY = ctx.margin + 40;
        float lineWidth = 160;
        float leftX = ctx.pageWidth / 2 - lineWidth - 30;
        float rightX = ctx.pageWidth / 2 + 30;

        try {
            // Ensure we have a stream to draw on
            ctx.ensurePageAndStream();

            if (sig1Data != null && !sig1Data.isBlank() && !"none".equals(sig1Type)) {
                String base64 = sig1Data.contains(",") ? sig1Data.split(",")[1] : sig1Data;
                byte[] bytes = Base64.getDecoder().decode(base64);
                PDImageXObject pdImg = PDImageXObject.createFromByteArray(ctx.doc, bytes, "sig1");
                float imgW = 80;
                float imgH = imgW * pdImg.getHeight() / pdImg.getWidth();
                ctx.cs.drawImage(pdImg, leftX + (lineWidth - imgW) / 2, lineY + 4, imgW, imgH);
            }
            ctx.cs.setStrokingColor(Color.DARK_GRAY);
            ctx.cs.setLineWidth(1);
            ctx.cs.moveTo(leftX, lineY);
            ctx.cs.lineTo(leftX + lineWidth, lineY);
            ctx.cs.stroke();
            if (sig1Label != null && !sig1Label.isBlank()) {
                PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                float lw = font.getStringWidth(sig1Label) / 1000 * 9;
                ctx.cs.beginText();
                ctx.cs.setFont(font, 9);
                ctx.cs.setNonStrokingColor(Color.GRAY);
                ctx.cs.newLineAtOffset(leftX + (lineWidth - lw) / 2, lineY - 14);
                ctx.cs.showText(sig1Label);
                ctx.cs.endText();
            }

            if (sig2Data != null && !sig2Data.isBlank() && !"none".equals(sig2Type)) {
                String base64 = sig2Data.contains(",") ? sig2Data.split(",")[1] : sig2Data;
                byte[] bytes = Base64.getDecoder().decode(base64);
                PDImageXObject pdImg = PDImageXObject.createFromByteArray(ctx.doc, bytes, "sig2");
                float imgW = 80;
                float imgH = imgW * pdImg.getHeight() / pdImg.getWidth();
                ctx.cs.drawImage(pdImg, rightX + (lineWidth - imgW) / 2, lineY + 4, imgW, imgH);
            }
            ctx.cs.moveTo(rightX, lineY);
            ctx.cs.lineTo(rightX + lineWidth, lineY);
            ctx.cs.stroke();
            if (sig2Label != null && !sig2Label.isBlank()) {
                PDType1Font font = new PDType1Font(Standard14Fonts.FontName.HELVETICA);
                float lw = font.getStringWidth(sig2Label) / 1000 * 9;
                ctx.cs.beginText();
                ctx.cs.setFont(font, 9);
                ctx.cs.setNonStrokingColor(Color.GRAY);
                ctx.cs.newLineAtOffset(rightX + (lineWidth - lw) / 2, lineY - 14);
                ctx.cs.showText(sig2Label);
                ctx.cs.endText();
            }
        } catch (Exception e) {
            log.warn("Signature draw error", e);
        }
    }

    private static class RenderContext {
        PDDocument doc;
        PDPageContentStream cs;
        float x;
        float y;
        float pageWidth;
        float pageHeight;
        float margin;
        String fontFamily = "Helvetica";
        float currentFontSize = 12;
        Color currentColor = Color.BLACK;
        boolean bold = false;
        boolean italic = false;
        boolean underline = false;
        String align = "left";

        void ensurePageAndStream() {
            try {
                if (cs == null) {
                    PDPage page = new PDPage(new PDRectangle(pageWidth, pageHeight));
                    doc.addPage(page);
                    cs = new PDPageContentStream(doc, page);
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to create page/content stream", e);
            }
        }

        void newPage() {
            try {
                if (cs != null) {
                    cs.close();
                    cs = null;
                }
                PDPage page = new PDPage(new PDRectangle(pageWidth, pageHeight));
                doc.addPage(page);
                cs = new PDPageContentStream(doc, page);
                y = pageHeight - margin;
                x = margin;
            } catch (Exception e) {
                throw new RuntimeException("Failed to create new page", e);
            }
        }

        void closeStream() {
            try {
                if (cs != null) {
                    cs.close();
                    cs = null;
                }
            } catch (Exception e) {
                throw new RuntimeException("Failed to close content stream", e);
            }
        }
    }

    private static class StyleBackup {
        String fontFamily;
        float fontSize;
        Color color;
        boolean bold;
        boolean italic;
        boolean underline;
        String align;
    }
}
