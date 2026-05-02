package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GuideResponse {
    private Integer id;
    private String title;
    private String detail;
    private String richHtml;
    private String pdfUrl;
    private Boolean hasText;
    private Boolean hasPdf;
    private String sectionsJson;
    private String audienceJson;
    private Integer ownerUserId;
    private String ownerName;
    private String attachmentsJson;
}