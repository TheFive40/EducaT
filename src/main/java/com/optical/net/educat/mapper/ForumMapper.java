package com.optical.net.educat.mapper;

import com.optical.net.educat.domain.Forum;
import com.optical.net.educat.dto.request.ForumRequest;
import com.optical.net.educat.dto.response.ForumResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class ForumMapper {
    private final UserMapper userMapper;

    public ForumResponse toResponse(Forum forum) {
        return ForumResponse.builder()
                .id(forum.getId())
                .title(forum.getTitle())
                .description(forum.getDescription())
                .createdBy(forum.getCreatedBy() != null ? userMapper.toResponse(forum.getCreatedBy()) : null)
                .build();
    }
    public Forum toEntity(ForumRequest request) {
        return Forum.builder()
                .title(request.getTitle())
                .description(request.getDescription())
                .build();
    }
}
