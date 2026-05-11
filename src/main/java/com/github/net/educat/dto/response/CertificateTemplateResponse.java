package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateTemplateResponse {
    private Integer id;
    private String name;
    private String description;
    private String headerText;
    private String subtitleText;
    private String bodyLinesJson;
    private String footerText;
    private String styleConfigJson;
    private String conditionsJson;
    private String signatureImageData;
    private String signatureType;
    private String signatureLabel;
    private String signatureImageData2;
    private String signatureType2;
    private String signatureLabel2;
    private String basePdfResource;
    private String baseDocxResource;
    private String editableHtml;
    private String fieldPositionsJson;
    private String docxFilePath;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
