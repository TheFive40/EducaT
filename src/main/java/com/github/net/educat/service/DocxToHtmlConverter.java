package com.github.net.educat.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.List;

@Slf4j
@Component
public class DocxToHtmlConverter {

    public String convert(InputStream docxInput) {
        try (XWPFDocument document = new XWPFDocument(docxInput)) {
            StringBuilder html = new StringBuilder();
            html.append("<div style=\"font-family:'Helvetica',sans-serif;line-height:1.5;\">");

            for (IBodyElement element : document.getBodyElements()) {
                if (element instanceof XWPFParagraph paragraph) {
                    html.append(convertParagraph(paragraph));
                } else if (element instanceof XWPFTable table) {
                    html.append(convertTable(table));
                }
            }

            html.append("</div>");
            return html.toString();
        } catch (Exception e) {
            log.error("Failed to convert docx to html", e);
            throw new RuntimeException("Failed to convert docx to html", e);
        }
    }

    private String convertParagraph(XWPFParagraph paragraph) {
        StringBuilder sb = new StringBuilder();
        String align = getAlignment(paragraph);
        String pStyle = "";
        if (align != null) {
            pStyle = "text-align:" + align + ";";
        }
        sb.append("<p style=\"").append(escapeHtml(pStyle)).append("margin:0;padding:2px 0;\">");

        List<XWPFRun> runs = paragraph.getRuns();
        if (runs == null || runs.isEmpty()) {
            sb.append("<br>");
        } else {
            for (XWPFRun run : runs) {
                sb.append(convertRun(run));
            }
        }

        sb.append("</p>");
        return sb.toString();
    }

    private String convertRun(XWPFRun run) {
        String text = run.getText(0);
        if (text == null || text.isEmpty()) {
            return "";
        }

        StringBuilder style = new StringBuilder();

        // Font family
        String fontFamily = run.getFontFamily();
        if (fontFamily == null || fontFamily.isBlank()) {
            fontFamily = run.getFontName();
        }
        if (fontFamily != null && !fontFamily.isBlank()) {
            style.append("font-family:'").append(fontFamily).append("',sans-serif;");
        }

        // Font size (half-points to px, approximate: 1 half-point = 0.35px)
        int fontSize = run.getFontSize();
        if (fontSize > 0) {
            int px = Math.round(fontSize * 0.35f);
            style.append("font-size:").append(Math.max(px, 10)).append("px;");
        }

        // Color
        String color = run.getColor();
        if (color != null && !color.isBlank() && !"auto".equalsIgnoreCase(color)) {
            style.append("color:#").append(color).append(";");
        }

        // Bold
        if (run.isBold()) {
            style.append("font-weight:bold;");
        }

        // Italic
        if (run.isItalic()) {
            style.append("font-style:italic;");
        }

        // Underline
        if (run.getUnderline() != UnderlinePatterns.NONE) {
            style.append("text-decoration:underline;");
        }

        String escapedText = escapeHtml(text);
        // Preserve line breaks within run text
        escapedText = escapedText.replace("\n", "<br>");

        return "<span style=\"" + style + "\">" + escapedText + "</span>";
    }

    private String convertTable(XWPFTable table) {
        StringBuilder sb = new StringBuilder();
        sb.append("<table style=\"width:100%;border-collapse:collapse;\">");
        for (XWPFTableRow row : table.getRows()) {
            sb.append("<tr>");
            for (XWPFTableCell cell : row.getTableCells()) {
                sb.append("<td style=\"border:1px solid #ccc;padding:4px;\">");
                for (XWPFParagraph p : cell.getParagraphs()) {
                    sb.append(convertParagraph(p));
                }
                sb.append("</td>");
            }
            sb.append("</tr>");
        }
        sb.append("</table>");
        return sb.toString();
    }

    private String getAlignment(XWPFParagraph paragraph) {
        ParagraphAlignment align = paragraph.getAlignment();
        if (align == null) return null;
        return switch (align) {
            case CENTER -> "center";
            case RIGHT -> "right";
            case BOTH -> "justify";
            default -> "left";
        };
    }

    private String escapeHtml(String text) {
        if (text == null) return "";
        return text
                .replace("&", "&amp;")
                .replace("<", "&lt;")
                .replace(">", "&gt;")
                .replace("\"", "&quot;");
    }
}
