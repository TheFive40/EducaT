package com.educat.es.application;

import com.educat.es.dto.request.CourseRequest;
import com.educat.es.dto.response.CourseResponse;
import java.util.List;

public interface CourseService {
    List<CourseResponse> findAll();
    CourseResponse findById(Integer id);
    CourseResponse save(CourseRequest request);
    CourseResponse update(Integer id, CourseRequest request);
    void delete(Integer id);
    List<CourseResponse> findByTeacherId(Integer teacherId);
}
