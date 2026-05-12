package com.github.net.educat.service;

import com.github.net.educat.domain.InstitutionalEvent;
import com.github.net.educat.dto.request.EventRequest;
import com.github.net.educat.dto.response.EventResponse;
import com.github.net.educat.mapper.EventMapper;
import com.github.net.educat.repository.InstitutionalEventRepository;
import com.github.net.educat.application.InstitutionalEventService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InstitutionalEventServiceImpl implements InstitutionalEventService {
    private final InstitutionalEventRepository eventRepository;
    private final EventMapper eventMapper;

    @Override @Transactional(readOnly = true)
    public List<EventResponse> findAll() {
        return eventRepository.findAll().stream().map(eventMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public EventResponse findById(Integer id) {
        return eventRepository.findById(id).map(eventMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
    }
    @Override
    public EventResponse save(EventRequest request) {
        InstitutionalEvent event = eventMapper.toEntity(request);
        event.setCreatedAt(LocalDateTime.now());
        return eventMapper.toResponse(eventRepository.save(event));
    }
    @Override
    public EventResponse update(Integer id, EventRequest request) {
        InstitutionalEvent event = eventRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Event not found: " + id));
        event.setTitle(request.getTitle());
        event.setCoverImage(request.getCoverImage());
        event.setLocation(request.getLocation());
        event.setEventDate(request.getEventDate());
        return eventMapper.toResponse(eventRepository.save(event));
    }
    @Override
    public void delete(Integer id) {
        if (!eventRepository.existsById(id)) throw new EntityNotFoundException("Event not found: " + id);
        eventRepository.deleteById(id);
    }
}
