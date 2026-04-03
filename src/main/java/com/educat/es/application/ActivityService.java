package com.educat.es.application;

import com.educat.es.dto.request.ActivityRequest;
import com.educat.es.dto.response.ActivityResponse;
import java.util.List;

public interface ActivityService {
    List<ActivityResponse> findAll();
    ActivityResponse findById(Integer id);
    ActivityResponse save(ActivityRequest request);
    ActivityResponse update(Integer id, ActivityRequest request);
    void delete(Integer id);
    List<ActivityResponse> findByCourseId(Integer courseId);
}
