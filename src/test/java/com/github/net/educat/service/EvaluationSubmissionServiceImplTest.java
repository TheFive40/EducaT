package com.github.net.educat.service;

import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Student;
import com.github.net.educat.dto.request.EvaluationSubmissionRequest;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.EvaluationSubmissionRepository;
import com.github.net.educat.repository.StudentRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Map;
import java.util.Optional;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.junit.jupiter.api.Assertions.assertNull;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyMap;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class EvaluationSubmissionServiceImplTest {

    @Mock
    private EvaluationSubmissionRepository evaluationSubmissionRepository;
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

    @InjectMocks
    private EvaluationSubmissionServiceImpl evaluationSubmissionService;

    @Test
    void upsert_whenEvaluationTypeIsInvalid_throwsIllegalArgumentException() {
        when(studentRepository.findById(1)).thenReturn(Optional.of(Student.builder().id(1).build()));
        when(courseRepository.findById(10)).thenReturn(Optional.of(Course.builder().id(10).build()));

        EvaluationSubmissionRequest request = EvaluationSubmissionRequest.builder()
                .studentId(1)
                .courseId(10)
                .evaluationType("midterm")
                .answers(Map.of("q1", "si"))
                .build();

        assertThrows(IllegalArgumentException.class, () -> evaluationSubmissionService.upsert(request));
        verify(evaluationSubmissionRepository, never()).save(any());
    }

    @Test
    void upsert_whenSubmittedFalse_savesDraftWithoutSubmittedAt() throws Exception {
        when(studentRepository.findById(1)).thenReturn(Optional.of(Student.builder().id(1).build()));
        when(courseRepository.findById(10)).thenReturn(Optional.of(Course.builder().id(10).build()));
        when(evaluationSubmissionRepository.findByStudentIdAndCourseIdAndEvaluationType(1, 10, "EVAL")).thenReturn(Optional.empty());
        when(objectMapper.writeValueAsString(anyMap())).thenReturn("{}");
        when(evaluationSubmissionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        EvaluationSubmissionRequest request = EvaluationSubmissionRequest.builder()
                .studentId(1)
                .courseId(10)
                .evaluationType("EVAL")
                .answers(Map.of("q1", "si"))
                .submitted(false)
                .build();

        var response = evaluationSubmissionService.upsert(request);

        assertNotNull(response);
        assertFalse(Boolean.TRUE.equals(response.getSubmitted()));
        assertNull(response.getSubmittedAt());
    }

    @Test
    void upsert_whenSubmittedTrue_marksSubmissionAsSent() throws Exception {
        when(studentRepository.findById(1)).thenReturn(Optional.of(Student.builder().id(1).build()));
        when(courseRepository.findById(10)).thenReturn(Optional.of(Course.builder().id(10).build()));
        when(evaluationSubmissionRepository.findByStudentIdAndCourseIdAndEvaluationType(1, 10, "AUTOEVAL")).thenReturn(Optional.empty());
        when(objectMapper.writeValueAsString(anyMap())).thenReturn("{}");
        when(evaluationSubmissionRepository.save(any())).thenAnswer(invocation -> invocation.getArgument(0));

        EvaluationSubmissionRequest request = EvaluationSubmissionRequest.builder()
                .studentId(1)
                .courseId(10)
                .evaluationType("AUTOEVAL")
                .answers(Map.of("a1", "si"))
                .submitted(true)
                .build();

        var response = evaluationSubmissionService.upsert(request);

        assertNotNull(response);
        assertTrue(Boolean.TRUE.equals(response.getSubmitted()));
        assertNotNull(response.getSubmittedAt());
    }
}

