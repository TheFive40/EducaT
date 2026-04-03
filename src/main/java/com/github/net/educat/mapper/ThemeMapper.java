package com.github.net.educat.mapper;

import com.github.net.educat.domain.Theme;
import com.github.net.educat.dto.request.ThemeRequest;
import com.github.net.educat.dto.response.ThemeResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ThemeMapper {
    private final InstitutionSettingsMapper settingsMapper;

    public ThemeResponse toResponse(Theme theme) {
        return ThemeResponse.builder()
                .id(theme.getId())
                .name(theme.getName())
                .baseColor(theme.getBaseColor())
                .settings(theme.getSettings() != null ? settingsMapper.toResponse(theme.getSettings()) : null)
                .build();
    }
    public Theme toEntity(ThemeRequest request) {
        return Theme.builder()
                .name(request.getName())
                .baseColor(request.getBaseColor())
                .build();
    }
}
