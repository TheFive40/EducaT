package com.educat.es.mapper;

import com.educat.es.domain.InstitutionSettings;
import com.educat.es.dto.request.InstitutionSettingsRequest;
import com.educat.es.dto.response.InstitutionSettingsResponse;
import org.springframework.stereotype.Component;

@Component
public class InstitutionSettingsMapper {
    public InstitutionSettingsResponse toResponse(InstitutionSettings settings) {
        return InstitutionSettingsResponse.builder()
                .id(settings.getId())
                .name(settings.getName())
                .logo(settings.getLogo())
                .primaryColor(settings.getPrimaryColor())
                .secondaryColor(settings.getSecondaryColor())
                .banner(settings.getBanner())
                .build();
    }
    public InstitutionSettings toEntity(InstitutionSettingsRequest request) {
        return InstitutionSettings.builder()
                .name(request.getName())
                .logo(request.getLogo())
                .primaryColor(request.getPrimaryColor())
                .secondaryColor(request.getSecondaryColor())
                .banner(request.getBanner())
                .build();
    }
}
