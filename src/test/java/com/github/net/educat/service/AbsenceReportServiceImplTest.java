package com.github.net.educat.service;

import com.github.net.educat.domain.AbsenceReport;
import com.github.net.educat.dto.request.AbsenceReportStatusRequest;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.AbsenceReportRepository;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AbsenceReportServiceImplTest {

    @Mock
    private AbsenceReportRepository absenceReportRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private StudentMapper studentMapper;
    @Mock
    private CourseMapper courseMapper;
    @Mock
    private ObjectMapper objectMapper;
    @Mock
    private UserRepository userRepository;

    @InjectMocks
    private AbsenceReportServiceImpl absenceReportService;

    @Test
    void updateStatus_whenStatusIsInvalid_throwsIllegalArgumentException() {
        when(absenceReportRepository.findById(15)).thenReturn(Optional.of(AbsenceReport.builder().id(15).build()));

        AbsenceReportStatusRequest request = AbsenceReportStatusRequest.builder()
                .status("archived")
                .reviewerUserId(2)
                .build();

        assertThrows(IllegalArgumentException.class, () -> absenceReportService.updateStatus(15, request));
        verify(absenceReportRepository, never()).save(any(AbsenceReport.class));
    }
}

