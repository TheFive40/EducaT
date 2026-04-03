package com.github.net.educat.application;

import com.github.net.educat.dto.request.InstitutionSettingsRequest;
import com.github.net.educat.dto.response.InstitutionSettingsResponse;
import java.util.List;

public interface InstitutionSettingsService {
    List<InstitutionSettingsResponse> findAll();
    InstitutionSettingsResponse findById(Integer id);
    InstitutionSettingsResponse save(InstitutionSettingsRequest request);
    InstitutionSettingsResponse update(Integer id, InstitutionSettingsRequest request);
    void delete(Integer id);
}
