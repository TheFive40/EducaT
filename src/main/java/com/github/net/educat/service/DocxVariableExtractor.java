package com.github.net.educat.service;

import lombok.extern.slf4j.Slf4j;
import org.apache.poi.xwpf.usermodel.*;
import org.springframework.stereotype.Component;

import java.io.InputStream;
import java.util.LinkedHashSet;
import java.util.Set;
import java.util.regex.Matcher;
import java.util.regex.Pattern;

@Slf4j
@Component
public class DocxVariableExtractor {

    private static final Pattern VAR_PATTERN = Pattern.compile("\\{([A-Z_][A-Z0-9_]*)\\}");

    public Set<String> extractVariables(InputStream docxInput) {
        Set<String> vars = new LinkedHashSet<>();
        try (XWPFDocument document = new XWPFDocument(docxInput)) {
            // Body paragraphs
            for (XWPFParagraph p : document.getParagraphs()) {
                extractFromText(p.getText(), vars);
            }
            // Tables
            for (XWPFTable table : document.getTables()) {
                for (XWPFTableRow row : table.getRows()) {
                    for (XWPFTableCell cell : row.getTableCells()) {
                        for (XWPFParagraph p : cell.getParagraphs()) {
                            extractFromText(p.getText(), vars);
                        }
                    }
                }
            }
            // Headers
            for (XWPFHeader header : document.getHeaderList()) {
                for (XWPFParagraph p : header.getParagraphs()) {
                    extractFromText(p.getText(), vars);
                }
                for (XWPFTable table : header.getTables()) {
                    for (XWPFTableRow row : table.getRows()) {
                        for (XWPFTableCell cell : row.getTableCells()) {
                            for (XWPFParagraph p : cell.getParagraphs()) {
                                extractFromText(p.getText(), vars);
                            }
                        }
                    }
                }
            }
            // Footers
            for (XWPFFooter footer : document.getFooterList()) {
                for (XWPFParagraph p : footer.getParagraphs()) {
                    extractFromText(p.getText(), vars);
                }
                for (XWPFTable table : footer.getTables()) {
                    for (XWPFTableRow row : table.getRows()) {
                        for (XWPFTableCell cell : row.getTableCells()) {
                            for (XWPFParagraph p : cell.getParagraphs()) {
                                extractFromText(p.getText(), vars);
                            }
                        }
                    }
                }
            }
        } catch (Exception e) {
            log.error("Failed to extract variables from docx", e);
            throw new RuntimeException("Failed to extract variables from docx", e);
        }
        return vars;
    }

    private void extractFromText(String text, Set<String> vars) {
        if (text == null || text.isBlank()) return;
        Matcher m = VAR_PATTERN.matcher(text);
        while (m.find()) {
            vars.add(m.group(1));
        }
    }
}
