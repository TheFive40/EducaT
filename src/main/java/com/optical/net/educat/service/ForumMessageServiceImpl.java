package com.optical.net.educat.service;

import com.optical.net.educat.domain.*;
import com.optical.net.educat.dto.request.ForumMessageRequest;
import com.optical.net.educat.dto.response.ForumMessageResponse;
import com.optical.net.educat.mapper.ForumMessageMapper;
import com.optical.net.educat.repository.*;
import com.optical.net.educat.application.ForumMessageService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ForumMessageServiceImpl implements ForumMessageService {
    private final ForumMessageRepository forumMessageRepository;
    private final ForumRepository forumRepository;
    private final UserRepository userRepository;
    private final ForumMessageMapper forumMessageMapper;

    @Override @Transactional(readOnly = true)
    public List<ForumMessageResponse> findAll() {
        return forumMessageRepository.findAll().stream().map(forumMessageMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ForumMessageResponse findById(Integer id) {
        return forumMessageRepository.findById(id).map(forumMessageMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("ForumMessage not found: " + id));
    }
    @Override
    public ForumMessageResponse save(ForumMessageRequest request) {
        Forum forum = forumRepository.findById(request.getForumId())
                .orElseThrow(() -> new EntityNotFoundException("Forum not found: " + request.getForumId()));
        User user = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getUserId()));
        ForumMessage message = forumMessageMapper.toEntity(request);
        message.setForum(forum);
        message.setUser(user);
        message.setCreatedAt(LocalDateTime.now());
        return forumMessageMapper.toResponse(forumMessageRepository.save(message));
    }
    @Override
    public void delete(Integer id) {
        if (!forumMessageRepository.existsById(id)) throw new EntityNotFoundException("ForumMessage not found: " + id);
        forumMessageRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<ForumMessageResponse> findByForumId(Integer forumId) {
        return forumMessageRepository.findByForumId(forumId).stream().map(forumMessageMapper::toResponse).toList();
    }
}
