package com.optical.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class StudentWellbeingResponse {
    private Integer id;
    private StudentResponse student;
    private String type;
    private String message;
    private LocalDateTime createdAt;
}
