package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.ScheduleRequest;
import com.optical.net.educat.dto.response.ScheduleResponse;
import java.util.List;

public interface ScheduleService {
    List<ScheduleResponse> findAll();
    ScheduleResponse findById(Integer id);
    ScheduleResponse save(ScheduleRequest request);
    ScheduleResponse update(Integer id, ScheduleRequest request);
    void delete(Integer id);
    List<ScheduleResponse> findByCourseId(Integer courseId);
}
