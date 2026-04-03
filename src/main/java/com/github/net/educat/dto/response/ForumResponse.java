package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class ForumResponse {
    private Integer id;
    private String title;
    private String description;
    private UserResponse createdBy;
}
