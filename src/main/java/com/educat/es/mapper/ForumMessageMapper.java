package com.educat.es.mapper;

import com.educat.es.domain.ForumMessage;
import com.educat.es.dto.request.ForumMessageRequest;
import com.educat.es.dto.response.ForumMessageResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ForumMessageMapper {
    private final ForumMapper forumMapper;
    private final UserMapper userMapper;

    public ForumMessageResponse toResponse(ForumMessage forumMessage) {
        return ForumMessageResponse.builder()
                .id(forumMessage.getId())
                .forum(forumMessage.getForum() != null ? forumMapper.toResponse(forumMessage.getForum()) : null)
                .user(forumMessage.getUser() != null ? userMapper.toResponse(forumMessage.getUser()) : null)
                .message(forumMessage.getMessage())
                .createdAt(forumMessage.getCreatedAt())
                .build();
    }
    public ForumMessage toEntity(ForumMessageRequest request) {
        return ForumMessage.builder()
                .message(request.getMessage())
                .build();
    }
}
