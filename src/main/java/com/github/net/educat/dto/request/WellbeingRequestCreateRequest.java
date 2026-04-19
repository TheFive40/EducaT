package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

import java.time.LocalDateTime;
import java.util.Map;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WellbeingRequestCreateRequest {
    @NotNull
    private Integer studentId;

    @NotBlank
    private String moduleType;

    @NotBlank
    @Size(max = 180)
    private String title;

    @Size(max = 5000)
    private String message;

    private LocalDateTime scheduledAt;

    private Map<String, Object> payload;
}

