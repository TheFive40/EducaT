package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.ThemeRequest;
import com.optical.net.educat.dto.response.ThemeResponse;
import java.util.List;

public interface ThemeService {
    List<ThemeResponse> findAll();
    ThemeResponse findById(Integer id);
    ThemeResponse save(ThemeRequest request);
    ThemeResponse update(Integer id, ThemeRequest request);
    void delete(Integer id);
}
