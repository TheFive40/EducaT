package com.github.net.educat.application;

import com.github.net.educat.dto.request.GuideRequest;
import com.github.net.educat.dto.response.GuideResponse;
import java.util.List;

public interface GuideService {
    List<GuideResponse> findAll(String search, String audience);
    GuideResponse findById(Integer id);
    GuideResponse save(GuideRequest request);
    GuideResponse update(Integer id, GuideRequest request);
    void delete(Integer id);
}