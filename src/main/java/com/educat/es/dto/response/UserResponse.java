package com.educat.es.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Integer id;
    private String name;
    private String email;
    private RoleResponse role;
    private Boolean status;
    private LocalDateTime createdAt;
}
