package com.github.net.educat.service;

import com.github.net.educat.domain.Schedule;
import com.github.net.educat.dto.response.ScheduleResponse;
import com.github.net.educat.mapper.ScheduleMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.ScheduleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.InjectMocks;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertNotNull;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class ScheduleServiceImplTest {

    @Mock
    private ScheduleRepository scheduleRepository;
    @Mock
    private CourseRepository courseRepository;
    @Mock
    private ScheduleMapper scheduleMapper;

    @InjectMocks
    private ScheduleServiceImpl scheduleService;

    @Test
    void findByStudentId_returnsMappedSchedules() {
        Integer studentId = 7;
        Schedule schedule = Schedule.builder().id(1).day("Lunes").build();
        ScheduleResponse response = ScheduleResponse.builder().id(1).day("Lunes").build();

        when(scheduleRepository.findByStudentId(studentId)).thenReturn(List.of(schedule));
        when(scheduleMapper.toResponse(schedule)).thenReturn(response);

        List<ScheduleResponse> result = scheduleService.findByStudentId(studentId);

        assertNotNull(result);
        assertEquals(1, result.size());
        assertEquals("Lunes", result.get(0).getDay());
        verify(scheduleRepository).findByStudentId(studentId);
        verify(scheduleMapper).toResponse(schedule);
    }
}

