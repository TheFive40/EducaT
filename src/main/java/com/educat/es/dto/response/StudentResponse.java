package com.educat.es.dto.response;

import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentResponse {
    private Integer id;
    private UserResponse user;
    private String studentCode;
}
