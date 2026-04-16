package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserResponse {
    private Integer id;
    private String name;
    private String email;
    private String documentId;
    private String phone;
    private RoleResponse role;
    private Boolean status;
    private LocalDateTime createdAt;
}
