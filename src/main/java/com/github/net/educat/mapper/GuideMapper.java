package com.github.net.educat.mapper;

import com.github.net.educat.domain.Guide;
import com.github.net.educat.dto.request.GuideRequest;
import com.github.net.educat.dto.response.GuideResponse;
import org.springframework.stereotype.Component;

@Component
public class GuideMapper {
    public GuideResponse toResponse(Guide guide) {
        return GuideResponse.builder()
                .id(guide.getId())
                .title(guide.getTitle())
                .detail(guide.getDetail())
                .richHtml(guide.getRichHtml())
                .pdfUrl(guide.getPdfUrl())
                .hasText(guide.getHasText())
                .hasPdf(guide.getHasPdf())
                .sectionsJson(guide.getSectionsJson())
                .audienceJson(guide.getAudienceJson())
                .ownerUserId(guide.getOwnerUserId())
                .ownerName(guide.getOwnerName())
                .attachmentsJson(guide.getAttachmentsJson())
                .build();
    }

    public Guide toEntity(GuideRequest request) {
        return Guide.builder()
                .title(request.getTitle())
                .detail(request.getDetail())
                .richHtml(request.getRichHtml())
                .pdfUrl(request.getPdfUrl())
                .hasText(request.getHasText())
                .hasPdf(request.getHasPdf())
                .sectionsJson(request.getSectionsJson())
                .audienceJson(request.getAudienceJson())
                .ownerUserId(request.getOwnerUserId())
                .ownerName(request.getOwnerName())
                .attachmentsJson(request.getAttachmentsJson())
                .build();
    }
}