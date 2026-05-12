package com.github.net.educat.application;

import com.github.net.educat.dto.request.EventRequest;
import com.github.net.educat.dto.response.EventResponse;
import java.util.List;

public interface InstitutionalEventService {
    List<EventResponse> findAll();
    EventResponse findById(Integer id);
    EventResponse save(EventRequest request);
    EventResponse update(Integer id, EventRequest request);
    void delete(Integer id);
}
