package com.github.net.educat.application;

import com.github.net.educat.dto.request.ActivitySubmissionRequest;
import com.github.net.educat.dto.response.ActivitySubmissionResponse;
import java.util.List;

public interface ActivitySubmissionService {
    List<ActivitySubmissionResponse> findAll();
    ActivitySubmissionResponse findById(Integer id);
    ActivitySubmissionResponse save(ActivitySubmissionRequest request);
    ActivitySubmissionResponse update(Integer id, ActivitySubmissionRequest request);
    ActivitySubmissionResponse grade(Integer id, Double grade, String feedback);
    void delete(Integer id);
    List<ActivitySubmissionResponse> findByActivityId(Integer activityId);
    List<ActivitySubmissionResponse> findByStudentId(Integer studentId);
    ActivitySubmissionResponse findByActivityIdAndStudentId(Integer activityId, Integer studentId);
}
