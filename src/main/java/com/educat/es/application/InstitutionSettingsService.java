package com.educat.es.application;

import com.educat.es.dto.request.InstitutionSettingsRequest;
import com.educat.es.dto.response.InstitutionSettingsResponse;
import java.util.List;

public interface InstitutionSettingsService {
    List<InstitutionSettingsResponse> findAll();
    InstitutionSettingsResponse findById(Integer id);
    InstitutionSettingsResponse save(InstitutionSettingsRequest request);
    InstitutionSettingsResponse update(Integer id, InstitutionSettingsRequest request);
    void delete(Integer id);
}
