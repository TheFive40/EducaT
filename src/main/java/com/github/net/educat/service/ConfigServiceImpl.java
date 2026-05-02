package com.github.net.educat.service;

import com.github.net.educat.application.ConfigService;
import com.github.net.educat.domain.InstitutionSettings;
import com.github.net.educat.dto.response.ConfigResponse;
import com.github.net.educat.repository.InstitutionSettingsRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class ConfigServiceImpl implements ConfigService {
    private final InstitutionSettingsRepository institutionSettingsRepository;

    private InstitutionSettings getOrCreateSettings() {
        return institutionSettingsRepository.findAll().stream().findFirst()
                .orElseGet(() -> institutionSettingsRepository.save(
                        InstitutionSettings.builder().name("default").build()));
    }

    @Override @Transactional(readOnly = true)
    public ConfigResponse getGradePolicy() {
        InstitutionSettings settings = getOrCreateSettings();
        return ConfigResponse.builder().key("gradePolicy").value(settings.getGradePolicyJson()).build();
    }

    @Override
    public ConfigResponse saveGradePolicy(String policy) {
        InstitutionSettings settings = getOrCreateSettings();
        settings.setGradePolicyJson(policy);
        institutionSettingsRepository.save(settings);
        return ConfigResponse.builder().key("gradePolicy").value(settings.getGradePolicyJson()).build();
    }

    @Override @Transactional(readOnly = true)
    public ConfigResponse getEnrollmentFormConfig() {
        InstitutionSettings settings = getOrCreateSettings();
        return ConfigResponse.builder().key("enrollmentFormConfig").value(settings.getEnrollmentFormConfigJson()).build();
    }

    @Override
    public ConfigResponse saveEnrollmentFormConfig(String config) {
        InstitutionSettings settings = getOrCreateSettings();
        settings.setEnrollmentFormConfigJson(config);
        institutionSettingsRepository.save(settings);
        return ConfigResponse.builder().key("enrollmentFormConfig").value(settings.getEnrollmentFormConfigJson()).build();
    }

    @Override @Transactional(readOnly = true)
    public ConfigResponse getWellbeingCatalog() {
        InstitutionSettings settings = getOrCreateSettings();
        return ConfigResponse.builder().key("wellbeingCatalog").value(settings.getWellbeingCatalogJson()).build();
    }

    @Override
    public ConfigResponse saveWellbeingCatalog(String catalog) {
        InstitutionSettings settings = getOrCreateSettings();
        settings.setWellbeingCatalogJson(catalog);
        institutionSettingsRepository.save(settings);
        return ConfigResponse.builder().key("wellbeingCatalog").value(settings.getWellbeingCatalogJson()).build();
    }

    @Override @Transactional(readOnly = true)
    public ConfigResponse getAssignmentRules() {
        InstitutionSettings settings = getOrCreateSettings();
        return ConfigResponse.builder().key("assignmentRules").value(settings.getAssignmentRulesJson()).build();
    }

    @Override
    public ConfigResponse saveAssignmentRules(String rules) {
        InstitutionSettings settings = getOrCreateSettings();
        settings.setAssignmentRulesJson(rules);
        institutionSettingsRepository.save(settings);
        return ConfigResponse.builder().key("assignmentRules").value(settings.getAssignmentRulesJson()).build();
    }
}