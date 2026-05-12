package com.github.net.educat.mapper;

import com.github.net.educat.domain.InstitutionalEvent;
import com.github.net.educat.dto.request.EventRequest;
import com.github.net.educat.dto.response.EventResponse;
import org.springframework.stereotype.Component;

@Component
public class EventMapper {
    public EventResponse toResponse(InstitutionalEvent event) {
        return EventResponse.builder()
                .id(event.getId())
                .title(event.getTitle())
                .coverImage(event.getCoverImage())
                .location(event.getLocation())
                .eventDate(event.getEventDate())
                .createdAt(event.getCreatedAt())
                .build();
    }
    public InstitutionalEvent toEntity(EventRequest request) {
        return InstitutionalEvent.builder()
                .title(request.getTitle())
                .coverImage(request.getCoverImage())
                .location(request.getLocation())
                .eventDate(request.getEventDate())
                .build();
    }
}
