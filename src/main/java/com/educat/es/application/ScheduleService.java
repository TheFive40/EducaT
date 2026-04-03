package com.educat.es.application;

import com.educat.es.dto.request.ScheduleRequest;
import com.educat.es.dto.response.ScheduleResponse;
import java.util.List;

public interface ScheduleService {
    List<ScheduleResponse> findAll();
    ScheduleResponse findById(Integer id);
    ScheduleResponse save(ScheduleRequest request);
    ScheduleResponse update(Integer id, ScheduleRequest request);
    void delete(Integer id);
    List<ScheduleResponse> findByCourseId(Integer courseId);
}
