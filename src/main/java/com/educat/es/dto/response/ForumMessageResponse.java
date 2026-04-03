package com.educat.es.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumMessageResponse {
    private Integer id;
    private ForumResponse forum;
    private UserResponse user;
    private String message;
    private LocalDateTime createdAt;
}
