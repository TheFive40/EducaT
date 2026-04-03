package com.educat.es.application;

import com.educat.es.dto.request.ThemeRequest;
import com.educat.es.dto.response.ThemeResponse;
import java.util.List;

public interface ThemeService {
    List<ThemeResponse> findAll();
    ThemeResponse findById(Integer id);
    ThemeResponse save(ThemeRequest request);
    ThemeResponse update(Integer id, ThemeRequest request);
    void delete(Integer id);
}
