package com.github.net.educat.service;

import com.github.net.educat.dto.request.CourseJoinByCodeRequest;
import com.github.net.educat.dto.response.CourseJoinByCodeResponse;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.EnrollmentRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.TeacherRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.Optional;

import static org.junit.jupiter.api.Assertions.*;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class CourseServiceImplTest {

    @Mock
    private CourseRepository courseRepository;
    @Mock
    private TeacherRepository teacherRepository;
    @Mock
    private StudentRepository studentRepository;
    @Mock
    private EnrollmentRepository enrollmentRepository;
    @Mock
    private CourseMapper courseMapper;

    @InjectMocks
    private CourseServiceImpl courseService;

    @Test
    void joinByCode_whenCodeDoesNotExist_returnsBusinessErrorWithoutThrowing() {
        when(courseRepository.findByCourseCodeIgnoreCase(anyString())).thenReturn(Optional.empty());

        CourseJoinByCodeRequest request = CourseJoinByCodeRequest.builder()
                .courseCode("CUR-NOEXISTE")
                .userId(10)
                .role("ESTUDIANTE")
                .build();

        CourseJoinByCodeResponse response = courseService.joinByCode(request);

        assertNotNull(response);
        assertFalse(response.isSuccess());
        assertEquals("COURSE_NOT_FOUND", response.getStatus());
        assertNotNull(response.getMessage());

        verify(teacherRepository, never()).findByUserId(request.getUserId());
        verify(studentRepository, never()).findByUserId(request.getUserId());
    }
}

