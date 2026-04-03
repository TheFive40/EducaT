package com.educat.es.mapper;

import com.educat.es.domain.Schedule;
import com.educat.es.dto.request.ScheduleRequest;
import com.educat.es.dto.response.ScheduleResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ScheduleMapper {
    private final CourseMapper courseMapper;

    public ScheduleResponse toResponse(Schedule schedule) {
        return ScheduleResponse.builder()
                .id(schedule.getId())
                .course(schedule.getCourse() != null ? courseMapper.toResponse(schedule.getCourse()) : null)
                .day(schedule.getDay())
                .startTime(schedule.getStartTime())
                .endTime(schedule.getEndTime())
                .build();
    }
    public Schedule toEntity(ScheduleRequest request) {
        return Schedule.builder()
                .day(request.getDay())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .build();
    }
}
