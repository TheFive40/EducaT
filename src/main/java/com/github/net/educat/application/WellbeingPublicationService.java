package com.github.net.educat.application;

import com.github.net.educat.dto.request.WellbeingPublicationRequest;
import com.github.net.educat.dto.response.StudentWellbeingContentResponse;
import com.github.net.educat.dto.response.WellbeingPublicationResponse;

import java.util.List;

public interface WellbeingPublicationService {
    List<WellbeingPublicationResponse> findAllPublications();
    WellbeingPublicationResponse createPublication(WellbeingPublicationRequest request);
    WellbeingPublicationResponse updatePublication(String id, WellbeingPublicationRequest request);
    void deletePublication(String id);
    StudentWellbeingContentResponse getStudentContent();
}

