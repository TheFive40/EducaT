package com.optical.net.educat.service;

import com.optical.net.educat.domain.*;
import com.optical.net.educat.dto.request.ForumRequest;
import com.optical.net.educat.dto.response.ForumResponse;
import com.optical.net.educat.mapper.ForumMapper;
import com.optical.net.educat.repository.*;
import com.optical.net.educat.application.ForumService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class ForumServiceImpl implements ForumService {
    private final ForumRepository forumRepository;
    private final UserRepository userRepository;
    private final ForumMapper forumMapper;

    @Override @Transactional(readOnly = true)
    public List<ForumResponse> findAll() {
        return forumRepository.findAll().stream().map(forumMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public ForumResponse findById(Integer id) {
        return forumRepository.findById(id).map(forumMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Forum not found: " + id));
    }
    @Override
    public ForumResponse save(ForumRequest request) {
        User user = userRepository.findById(request.getCreatedById())
                .orElseThrow(() -> new EntityNotFoundException("User not found: " + request.getCreatedById()));
        Forum forum = forumMapper.toEntity(request);
        forum.setCreatedBy(user);
        return forumMapper.toResponse(forumRepository.save(forum));
    }
    @Override
    public ForumResponse update(Integer id, ForumRequest request) {
        Forum forum = forumRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Forum not found: " + id));
        forum.setTitle(request.getTitle());
        forum.setDescription(request.getDescription());
        return forumMapper.toResponse(forumRepository.save(forum));
    }
    @Override
    public void delete(Integer id) {
        if (!forumRepository.existsById(id)) throw new EntityNotFoundException("Forum not found: " + id);
        forumRepository.deleteById(id);
    }
}
