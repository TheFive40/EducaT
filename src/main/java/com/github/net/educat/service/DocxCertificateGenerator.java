package com.github.net.educat.service;

import lombok.extern.slf4j.Slf4j;
import org.docx4j.Docx4J;
import org.docx4j.openpackaging.packages.WordprocessingMLPackage;
import org.springframework.stereotype.Component;

import java.io.ByteArrayInputStream;
import java.io.ByteArrayOutputStream;
import java.nio.charset.StandardCharsets;
import java.util.Map;
import java.util.zip.ZipEntry;
import java.util.zip.ZipInputStream;
import java.util.zip.ZipOutputStream;

@Slf4j
@Component
public class DocxCertificateGenerator {

    public byte[] generate(byte[] docxTemplateBytes, Map<String, String> placeholders) {
        try {
            // Step 1: Replace variables directly in the .docx ZIP XML entries
            byte[] modifiedDocx = replaceVariablesInDocxZip(docxTemplateBytes, placeholders);

            // Step 2: Convert modified docx to PDF using docx4j
            return convertDocxToPdf(modifiedDocx);
        } catch (Exception e) {
            log.error("Failed to generate certificate from docx", e);
            throw new RuntimeException("Failed to generate certificate from docx: " + e.getMessage(), e);
        }
    }

    /**
     * Replaces variables directly inside the XML files within the .docx ZIP.
     * This preserves 100% of the document structure, images, tables, styles, etc.
     * Returns the modified .docx bytes (not converted to PDF).
     */
    public byte[] replaceVariablesInDocxZip(byte[] docxBytes, Map<String, String> placeholders) throws Exception {
        try (ByteArrayInputStream bais = new ByteArrayInputStream(docxBytes);
             ZipInputStream zis = new ZipInputStream(bais);
             ByteArrayOutputStream baos = new ByteArrayOutputStream();
             ZipOutputStream zos = new ZipOutputStream(baos)) {

            ZipEntry entry;
            while ((entry = zis.getNextEntry()) != null) {
                String entryName = entry.getName();
                byte[] entryBytes = zis.readAllBytes();

                // Only modify XML files that contain document text
                if (isTextXmlEntry(entryName)) {
                    String xmlContent = new String(entryBytes, StandardCharsets.UTF_8);
                    String modifiedXml = replacePlaceholdersInXml(xmlContent, placeholders);

                    if (!modifiedXml.equals(xmlContent)) {
                        entryBytes = modifiedXml.getBytes(StandardCharsets.UTF_8);
                    }
                }

                // Copy entry to output ZIP (preserving all non-XML entries like images intact)
                ZipEntry newEntry = new ZipEntry(entryName);
                zos.putNextEntry(newEntry);
                zos.write(entryBytes);
                zos.closeEntry();
            }

            zos.finish();
            return baos.toByteArray();
        }
    }

    private boolean isTextXmlEntry(String entryName) {
        if (!entryName.endsWith(".xml")) return false;
        return entryName.startsWith("word/document")
            || entryName.startsWith("word/header")
            || entryName.startsWith("word/footer")
            || entryName.startsWith("word/endnotes")
            || entryName.startsWith("word/footnotes");
    }

    private String replacePlaceholdersInXml(String xmlContent, Map<String, String> placeholders) {
        String result = xmlContent;
        for (Map.Entry<String, String> entry : placeholders.entrySet()) {
            String var = "{" + entry.getKey() + "}";
            if (result.contains(var)) {
                String val = entry.getValue() != null ? entry.getValue() : "";
                // XML-escape the replacement value to prevent breaking the XML structure
                val = escapeXml(val);
                result = result.replace(var, val);
            }
        }
        return result;
    }

    private String escapeXml(String text) {
        if (text == null) return "";
        return text
            .replace("&", "&amp;")
            .replace("<", "&lt;")
            .replace(">", "&gt;")
            .replace("\"", "&quot;")
            .replace("'", "&apos;");
    }

    private byte[] convertDocxToPdf(byte[] docxBytes) throws Exception {
        java.nio.file.Path tempFile = java.nio.file.Files.createTempFile("cert-", ".docx");
        try {
            java.nio.file.Files.write(tempFile, docxBytes);
            WordprocessingMLPackage wmlPackage = WordprocessingMLPackage.load(tempFile.toFile());

            ByteArrayOutputStream pdfOutput = new ByteArrayOutputStream();
            Docx4J.toPDF(wmlPackage, pdfOutput);
            byte[] result = pdfOutput.toByteArray();
            if (result == null || result.length == 0) {
                throw new IllegalStateException("PDF generation produced empty output");
            }
            return result;
        } finally {
            java.nio.file.Files.deleteIfExists(tempFile);
        }
    }
}
