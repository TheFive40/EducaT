package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.TeacherRequest;
import com.optical.net.educat.dto.response.TeacherResponse;
import java.util.List;

public interface TeacherService {
    List<TeacherResponse> findAll();
    TeacherResponse findById(Integer id);
    TeacherResponse save(TeacherRequest request);
    TeacherResponse update(Integer id, TeacherRequest request);
    void delete(Integer id);
}
