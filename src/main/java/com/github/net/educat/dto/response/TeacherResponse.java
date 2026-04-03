package com.github.net.educat.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class TeacherResponse {
    private Integer id;
    private UserResponse user;
    private String specialization;
}
