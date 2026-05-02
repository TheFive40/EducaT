package com.github.net.educat.application;

import com.github.net.educat.dto.request.CourseUnitRequest;
import com.github.net.educat.dto.response.CourseUnitResponse;

import java.util.List;

public interface CourseUnitService {
    List<CourseUnitResponse> findAll();
    List<CourseUnitResponse> findByCourseId(Integer courseId);
    CourseUnitResponse findById(Integer id);
    CourseUnitResponse save(CourseUnitRequest request);
    CourseUnitResponse update(Integer id, CourseUnitRequest request);
    void delete(Integer id);
}