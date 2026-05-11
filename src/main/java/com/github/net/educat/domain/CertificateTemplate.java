package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "certificate_templates")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class CertificateTemplate {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String name;

    @Column(columnDefinition = "TEXT")
    private String description;

    @Column(name = "header_text", length = 200)
    private String headerText;

    @Column(name = "subtitle_text", length = 300)
    private String subtitleText;

    @Column(name = "body_lines_json", columnDefinition = "TEXT")
    private String bodyLinesJson;

    @Column(name = "footer_text", length = 300)
    private String footerText;

    @Column(name = "style_config_json", columnDefinition = "TEXT")
    private String styleConfigJson;

    @Column(name = "conditions_json", columnDefinition = "TEXT")
    private String conditionsJson;

    @Column(name = "signature_image_data", columnDefinition = "TEXT")
    private String signatureImageData;

    @Column(name = "signature_type", length = 20)
    private String signatureType;

    @Column(name = "signature_label", length = 200)
    private String signatureLabel;

    @Column(name = "signature_image_data2", columnDefinition = "TEXT")
    private String signatureImageData2;

    @Column(name = "signature_type2", length = 20)
    private String signatureType2;

    @Column(name = "signature_label2", length = 200)
    private String signatureLabel2;

    @Column(name = "base_pdf_resource", length = 100)
    private String basePdfResource;

    @Column(name = "base_docx_resource", length = 100)
    private String baseDocxResource;

    @Column(name = "editable_html", columnDefinition = "TEXT")
    private String editableHtml;

    @Column(name = "field_positions_json", columnDefinition = "TEXT")
    private String fieldPositionsJson;

    @Column(name = "docx_file_path", length = 500)
    private String docxFilePath;

    @Column(name = "created_at")
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;
}
