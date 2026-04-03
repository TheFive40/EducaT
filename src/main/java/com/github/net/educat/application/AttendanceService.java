package com.github.net.educat.application;

import com.github.net.educat.dto.request.AttendanceRequest;
import com.github.net.educat.dto.response.AttendanceResponse;
import java.util.List;

public interface AttendanceService {
    List<AttendanceResponse> findAll();
    AttendanceResponse findById(Integer id);
    AttendanceResponse save(AttendanceRequest request);
    AttendanceResponse update(Integer id, AttendanceRequest request);
    void delete(Integer id);
    List<AttendanceResponse> findByStudentId(Integer studentId);
    List<AttendanceResponse> findByCourseId(Integer courseId);
}
