package com.github.net.educat.domain;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.GeneratedValue;
import jakarta.persistence.GenerationType;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Entity
@Table(name = "guides")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Guide {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;

    @Column(nullable = false, length = 200)
    private String title;

    @Column(name = "detail", columnDefinition = "TEXT")
    private String detail;

    @Column(name = "rich_html", columnDefinition = "TEXT")
    private String richHtml;

    @Column(name = "pdf_url", columnDefinition = "TEXT")
    private String pdfUrl;

    @Column(name = "has_text")
    private Boolean hasText;

    @Column(name = "has_pdf")
    private Boolean hasPdf;

    @Column(name = "sections_json", columnDefinition = "TEXT")
    private String sectionsJson;

    @Column(name = "audience_json", columnDefinition = "TEXT")
    private String audienceJson;

    @Column(name = "owner_user_id")
    private Integer ownerUserId;

    @Column(name = "owner_name", length = 200)
    private String ownerName;

    @Column(name = "attachments_json", columnDefinition = "TEXT")
    private String attachmentsJson;
}