package com.optical.net.educat.application;

import com.optical.net.educat.dto.request.ActivityRequest;
import com.optical.net.educat.dto.response.ActivityResponse;
import java.util.List;

public interface ActivityService {
    List<ActivityResponse> findAll();
    ActivityResponse findById(Integer id);
    ActivityResponse save(ActivityRequest request);
    ActivityResponse update(Integer id, ActivityRequest request);
    void delete(Integer id);
    List<ActivityResponse> findByCourseId(Integer courseId);
}
