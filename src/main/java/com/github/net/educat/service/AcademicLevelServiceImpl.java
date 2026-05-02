package com.github.net.educat.service;

import com.github.net.educat.application.AcademicLevelService;
import com.github.net.educat.domain.AcademicLevel;
import com.github.net.educat.dto.request.AcademicLevelRequest;
import com.github.net.educat.dto.response.AcademicLevelResponse;
import com.github.net.educat.mapper.AcademicLevelMapper;
import com.github.net.educat.repository.AcademicLevelRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicLevelServiceImpl implements AcademicLevelService {
    private final AcademicLevelRepository academicLevelRepository;
    private final AcademicLevelMapper academicLevelMapper;

    @Override @Transactional(readOnly = true)
    public List<AcademicLevelResponse> findAll() {
        return academicLevelRepository.findAll().stream().map(academicLevelMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public AcademicLevelResponse findById(Integer id) {
        return academicLevelRepository.findById(id).map(academicLevelMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("AcademicLevel not found: " + id));
    }

    @Override
    public AcademicLevelResponse save(AcademicLevelRequest request) {
        AcademicLevel level = academicLevelMapper.toEntity(request);
        return academicLevelMapper.toResponse(academicLevelRepository.save(level));
    }

    @Override
    public AcademicLevelResponse update(Integer id, AcademicLevelRequest request) {
        AcademicLevel level = academicLevelRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AcademicLevel not found: " + id));
        level.setName(request.getName());
        level.setDescription(request.getDescription());
        return academicLevelMapper.toResponse(academicLevelRepository.save(level));
    }

    @Override
    public void delete(Integer id) {
        if (!academicLevelRepository.existsById(id)) throw new EntityNotFoundException("AcademicLevel not found: " + id);
        academicLevelRepository.deleteById(id);
    }
}