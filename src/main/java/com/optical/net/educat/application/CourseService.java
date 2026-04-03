package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.CourseRequest;
import com.optical.net.educat.dto.response.CourseResponse;
import java.util.List;

public interface CourseService {
    List<CourseResponse> findAll();
    CourseResponse findById(Integer id);
    CourseResponse save(CourseRequest request);
    CourseResponse update(Integer id, CourseRequest request);
    void delete(Integer id);
    List<CourseResponse> findByTeacherId(Integer teacherId);
}
