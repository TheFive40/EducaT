package com.optical.net.educat.service;

import com.optical.net.educat.domain.InstitutionSettings;
import com.optical.net.educat.dto.request.InstitutionSettingsRequest;
import com.optical.net.educat.dto.response.InstitutionSettingsResponse;
import com.optical.net.educat.mapper.InstitutionSettingsMapper;
import com.optical.net.educat.repository.InstitutionSettingsRepository;
import com.optical.net.educat.application.InstitutionSettingsService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InstitutionSettingsServiceImpl implements InstitutionSettingsService {
    private final InstitutionSettingsRepository settingsRepository;
    private final InstitutionSettingsMapper settingsMapper;

    @Override @Transactional(readOnly = true)
    public List<InstitutionSettingsResponse> findAll() {
        return settingsRepository.findAll().stream().map(settingsMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public InstitutionSettingsResponse findById(Integer id) {
        return settingsRepository.findById(id).map(settingsMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("InstitutionSettings not found: " + id));
    }
    @Override
    public InstitutionSettingsResponse save(InstitutionSettingsRequest request) {
        InstitutionSettings settings = settingsMapper.toEntity(request);
        return settingsMapper.toResponse(settingsRepository.save(settings));
    }
    @Override
    public InstitutionSettingsResponse update(Integer id, InstitutionSettingsRequest request) {
        InstitutionSettings settings = settingsRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("InstitutionSettings not found: " + id));
        settings.setName(request.getName());
        settings.setLogo(request.getLogo());
        settings.setPrimaryColor(request.getPrimaryColor());
        settings.setSecondaryColor(request.getSecondaryColor());
        settings.setBanner(request.getBanner());
        return settingsMapper.toResponse(settingsRepository.save(settings));
    }
    @Override
    public void delete(Integer id) {
        if (!settingsRepository.existsById(id)) throw new EntityNotFoundException("InstitutionSettings not found: " + id);
        settingsRepository.deleteById(id);
    }
}
