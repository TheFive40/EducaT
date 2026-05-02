package com.github.net.educat.service;

import com.github.net.educat.application.AcademicGradeService;
import com.github.net.educat.domain.AcademicGrade;
import com.github.net.educat.domain.AcademicLevel;
import com.github.net.educat.dto.request.AcademicGradeRequest;
import com.github.net.educat.dto.response.AcademicGradeResponse;
import com.github.net.educat.mapper.AcademicGradeMapper;
import com.github.net.educat.repository.AcademicGradeRepository;
import com.github.net.educat.repository.AcademicLevelRepository;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AcademicGradeServiceImpl implements AcademicGradeService {
    private final AcademicGradeRepository academicGradeRepository;
    private final AcademicLevelRepository academicLevelRepository;
    private final AcademicGradeMapper academicGradeMapper;

    @Override @Transactional(readOnly = true)
    public List<AcademicGradeResponse> findAll() {
        return academicGradeRepository.findAll().stream().map(academicGradeMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public List<AcademicGradeResponse> findByLevelId(Integer levelId) {
        return academicGradeRepository.findByLevelId(levelId).stream().map(academicGradeMapper::toResponse).toList();
    }

    @Override @Transactional(readOnly = true)
    public AcademicGradeResponse findById(Integer id) {
        return academicGradeRepository.findById(id).map(academicGradeMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("AcademicGrade not found: " + id));
    }

    @Override
    public AcademicGradeResponse save(AcademicGradeRequest request) {
        AcademicLevel level = academicLevelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new EntityNotFoundException("AcademicLevel not found: " + request.getLevelId()));
        AcademicGrade grade = academicGradeMapper.toEntity(request);
        grade.setLevel(level);
        return academicGradeMapper.toResponse(academicGradeRepository.save(grade));
    }

    @Override
    public AcademicGradeResponse update(Integer id, AcademicGradeRequest request) {
        AcademicGrade grade = academicGradeRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("AcademicGrade not found: " + id));
        AcademicLevel level = academicLevelRepository.findById(request.getLevelId())
                .orElseThrow(() -> new EntityNotFoundException("AcademicLevel not found: " + request.getLevelId()));
        grade.setLevel(level);
        grade.setName(request.getName());
        return academicGradeMapper.toResponse(academicGradeRepository.save(grade));
    }

    @Override
    public void delete(Integer id) {
        if (!academicGradeRepository.existsById(id)) throw new EntityNotFoundException("AcademicGrade not found: " + id);
        academicGradeRepository.deleteById(id);
    }
}