package com.github.net.educat.service;

import com.github.net.educat.domain.Certificate;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.CertificateRequest;
import com.github.net.educat.dto.response.CertificateResponse;
import com.github.net.educat.mapper.CertificateMapper;
import com.github.net.educat.repository.CertificateRepository;
import com.github.net.educat.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.any;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CertificateServiceImplTest {

    @Mock
    private CertificateRepository certificateRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private CertificateMapper certificateMapper;

    @InjectMocks
    private CertificateServiceImpl certificateService;

    @Test
    void save_whenIssuedAtAndStatusMissing_setsDefaults() {
        CertificateRequest request = CertificateRequest.builder()
                .studentId(4)
                .name("Certificado de estudio")
                .filePath("/files/cert-1.pdf")
                .build();

        Student student = Student.builder().id(4).build();
        Certificate mapped = Certificate.builder().name(request.getName()).filePath(request.getFilePath()).build();
        Certificate saved = Certificate.builder()
                .id(15)
                .student(student)
                .name(request.getName())
                .filePath(request.getFilePath())
                .issuedAt(LocalDate.now())
                .status("available")
                .build();
        CertificateResponse response = CertificateResponse.builder().id(15).status("available").build();

        when(studentRepository.findById(4)).thenReturn(Optional.of(student));
        when(certificateMapper.toEntity(request)).thenReturn(mapped);
        when(certificateRepository.save(any(Certificate.class))).thenReturn(saved);
        when(certificateMapper.toResponse(saved)).thenReturn(response);

        CertificateResponse result = certificateService.save(request);

        ArgumentCaptor<Certificate> captor = ArgumentCaptor.forClass(Certificate.class);
        verify(certificateRepository).save(captor.capture());
        Certificate toPersist = captor.getValue();

        assertNotNull(toPersist.getIssuedAt());
        assertEquals("available", toPersist.getStatus());
        assertNotNull(result);
        assertEquals(15, result.getId());
        assertEquals("available", result.getStatus());
    }
}

