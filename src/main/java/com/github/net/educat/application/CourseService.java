package com.github.net.educat.application;

import com.github.net.educat.dto.request.CourseRequest;
import com.github.net.educat.dto.request.CourseJoinByCodeRequest;
import com.github.net.educat.dto.response.CourseJoinByCodeResponse;
import com.github.net.educat.dto.response.CourseResponse;
import java.util.List;

public interface CourseService {
    List<CourseResponse> findAll();
    CourseResponse findById(Integer id);
    CourseResponse save(CourseRequest request);
    CourseResponse update(Integer id, CourseRequest request);
    void delete(Integer id);
    List<CourseResponse> findByTeacherId(Integer teacherId);
    List<CourseResponse> findAvailableForTeacher();
    CourseJoinByCodeResponse joinByCode(CourseJoinByCodeRequest request);
}
