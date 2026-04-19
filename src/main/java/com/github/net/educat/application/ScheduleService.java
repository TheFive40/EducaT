package com.github.net.educat.application;

import com.github.net.educat.dto.request.ScheduleRequest;
import com.github.net.educat.dto.response.ScheduleResponse;
import java.util.List;

public interface ScheduleService {
    List<ScheduleResponse> findAll();
    ScheduleResponse findById(Integer id);
    ScheduleResponse save(ScheduleRequest request);
    ScheduleResponse update(Integer id, ScheduleRequest request);
    void delete(Integer id);
    List<ScheduleResponse> findByCourseId(Integer courseId);
    List<ScheduleResponse> findByTeacherId(Integer teacherId);
    List<ScheduleResponse> findByStudentId(Integer studentId);
}
