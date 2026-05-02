package com.github.net.educat.service;

import com.github.net.educat.application.GuideService;
import com.github.net.educat.domain.Guide;
import com.github.net.educat.dto.request.GuideRequest;
import com.github.net.educat.dto.response.GuideResponse;
import com.github.net.educat.mapper.GuideMapper;
import com.github.net.educat.repository.GuideRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class GuideServiceImpl implements GuideService {
    private final GuideRepository guideRepository;
    private final GuideMapper guideMapper;

    @Override @Transactional(readOnly = true)
    public List<GuideResponse> findAll(String search, String audience) {
        List<Guide> all = guideRepository.findAll();
        String s = search != null ? search.trim().toLowerCase() : "";
        String a = audience != null ? audience.trim().toUpperCase() : "";
        return all.stream().filter(g -> {
            if (!s.isEmpty()) {
                String title = g.getTitle() != null ? g.getTitle().toLowerCase() : "";
                String detail = g.getDetail() != null ? g.getDetail().toLowerCase() : "";
                if (!title.contains(s) && !detail.contains(s)) return false;
            }
            if (!a.isEmpty()) {
                String aud = g.getAudienceJson() != null ? g.getAudienceJson().toUpperCase() : "";
                if (!aud.contains(a)) return false;
            }
            return true;
        }).map(guideMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public GuideResponse findById(Integer id) {
        return guideRepository.findById(id).map(guideMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Guide not found: " + id));
    }

    @Override
    public GuideResponse save(GuideRequest request) {
        Guide guide = guideMapper.toEntity(request);
        return guideMapper.toResponse(guideRepository.save(guide));
    }

    @Override
    public GuideResponse update(Integer id, GuideRequest request) {
        Guide guide = guideRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Guide not found: " + id));
        guide.setTitle(request.getTitle());
        guide.setDetail(request.getDetail());
        guide.setRichHtml(request.getRichHtml());
        guide.setPdfUrl(request.getPdfUrl());
        guide.setHasText(request.getHasText());
        guide.setHasPdf(request.getHasPdf());
        guide.setSectionsJson(request.getSectionsJson());
        guide.setAudienceJson(request.getAudienceJson());
        guide.setOwnerUserId(request.getOwnerUserId());
        guide.setOwnerName(request.getOwnerName());
        guide.setAttachmentsJson(request.getAttachmentsJson());
        return guideMapper.toResponse(guideRepository.save(guide));
    }

    @Override
    public void delete(Integer id) {
        if (!guideRepository.existsById(id)) throw new EntityNotFoundException("Guide not found: " + id);
        guideRepository.deleteById(id);
    }
}