package com.github.net.educat.service;

import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.WellbeingRequest;
import com.github.net.educat.dto.request.WellbeingRequestCreateRequest;
import com.github.net.educat.dto.request.WellbeingRequestStatusRequest;
import com.github.net.educat.dto.response.WellbeingRequestResponse;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.WellbeingRequestRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class WellbeingRequestServiceImplTest {

    @Mock
    private WellbeingRequestRepository wellbeingRequestRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private StudentMapper studentMapper;
    @Mock
    private ObjectMapper objectMapper;

    @InjectMocks
    private WellbeingRequestServiceImpl wellbeingRequestService;

    @Test
    void create_whenModuleTypeIsInvalid_throwsIllegalArgumentException() {
        when(studentRepository.findById(7)).thenReturn(Optional.of(Student.builder().id(7).build()));

        WellbeingRequestCreateRequest request = WellbeingRequestCreateRequest.builder()
                .studentId(7)
                .moduleType("nutrition")
                .title("Necesito apoyo")
                .message("Detalle")
                .build();

        assertThrows(IllegalArgumentException.class, () -> wellbeingRequestService.create(request));
        verify(wellbeingRequestRepository, never()).save(any());
    }

    @Test
    void create_whenLegacySpanishTitle_mapsToContractTitle() {
        when(studentRepository.findById(7)).thenReturn(Optional.of(Student.builder().id(7).build()));
        when(wellbeingRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WellbeingRequestCreateRequest request = WellbeingRequestCreateRequest.builder()
                .studentId(7)
                .moduleType("PSYCHOLOGY")
                .title("Cita psicológica")
                .message("Detalle")
                .build();

        WellbeingRequestResponse response = wellbeingRequestService.create(request);
        assertEquals("PSYCH_APPOINTMENT", response.getTitle());
    }

    @Test
    void updateStatus_whenResolutionCommentIsBlank_storesNullComment() {
        WellbeingRequest entity = WellbeingRequest.builder()
                .id(15)
                .student(Student.builder().id(7).build())
                .moduleType("PSYCHOLOGY")
                .title("PSYCH_APPOINTMENT")
                .status("PENDING")
                .build();
        when(wellbeingRequestRepository.findById(15)).thenReturn(Optional.of(entity));
        when(wellbeingRequestRepository.save(any())).thenAnswer(inv -> inv.getArgument(0));

        WellbeingRequestStatusRequest request = WellbeingRequestStatusRequest.builder()
                .status("APPROVED")
                .resolutionComment("   ")
                .build();

        WellbeingRequestResponse response = wellbeingRequestService.updateStatus(15, request);
        assertEquals("APPROVED", response.getStatus());
        assertNull(response.getResolutionComment());
    }
}

