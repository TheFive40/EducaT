package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class GuideRequest {
    @NotBlank
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