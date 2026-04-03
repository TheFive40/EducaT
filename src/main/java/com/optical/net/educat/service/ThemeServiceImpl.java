package com.optical.net.educat.service;

import com.optical.net.educat.domain.*;
import com.optical.net.educat.dto.request.ThemeRequest;
import com.optical.net.educat.dto.response.ThemeResponse;
import com.optical.net.educat.mapper.ThemeMapper;
import com.optical.net.educat.repository.*;
import com.optical.net.educat.application.ThemeService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ThemeServiceImpl implements ThemeService {
    private final ThemeRepository themeRepository;
    private final InstitutionSettingsRepository settingsRepository;
    private final ThemeMapper themeMapper;

    @Override @Transactional(readOnly = true)
    public List<ThemeResponse> findAll() {
        return themeRepository.findAll().stream().map(themeMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ThemeResponse findById(Integer id) {
        return themeRepository.findById(id).map(themeMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Theme not found: " + id));
    }
    @Override
    public ThemeResponse save(ThemeRequest request) {
        InstitutionSettings settings = settingsRepository.findById(request.getSettingsId())
                .orElseThrow(() -> new EntityNotFoundException("InstitutionSettings not found: " + request.getSettingsId()));
        Theme theme = themeMapper.toEntity(request);
        theme.setSettings(settings);
        return themeMapper.toResponse(themeRepository.save(theme));
    }
    @Override
    public ThemeResponse update(Integer id, ThemeRequest request) {
        Theme theme = themeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Theme not found: " + id));
        InstitutionSettings settings = settingsRepository.findById(request.getSettingsId())
                .orElseThrow(() -> new EntityNotFoundException("InstitutionSettings not found: " + request.getSettingsId()));
        theme.setName(request.getName());
        theme.setBaseColor(request.getBaseColor());
        theme.setSettings(settings);
        return themeMapper.toResponse(themeRepository.save(theme));
    }
    @Override
    public void delete(Integer id) {
        if (!themeRepository.existsById(id)) throw new EntityNotFoundException("Theme not found: " + id);
        themeRepository.deleteById(id);
    }
}
