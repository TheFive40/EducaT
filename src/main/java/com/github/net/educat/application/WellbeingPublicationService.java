package com.github.net.educat.application;

import com.github.net.educat.dto.request.WellbeingPublicationRequest;
import com.github.net.educat.dto.response.StudentWellbeingContentResponse;
import com.github.net.educat.dto.response.WellbeingPublicationResponse;

import java.util.List;

public interface WellbeingPublicationService {
    List<WellbeingPublicationResponse> findAllPublications();
    List<WellbeingPublicationResponse> findPendingPublications();
    WellbeingPublicationResponse createPublication(WellbeingPublicationRequest request, boolean publishDirectly);
    WellbeingPublicationResponse updatePublication(String id, WellbeingPublicationRequest request);
    void deletePublication(String id);
    WellbeingPublicationResponse reviewPublication(String id, String status, String reviewedBy, String resolutionComment);
    StudentWellbeingContentResponse getStudentContent();
    void autoPublishOverdue();
}

