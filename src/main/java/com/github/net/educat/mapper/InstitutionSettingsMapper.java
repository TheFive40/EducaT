package com.github.net.educat.mapper;

import com.github.net.educat.domain.InstitutionSettings;
import com.github.net.educat.dto.request.InstitutionSettingsRequest;
import com.github.net.educat.dto.response.InstitutionSettingsResponse;
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
