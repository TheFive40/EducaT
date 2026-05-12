package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventRequest {
    @NotBlank
    private String title;
    private String coverImage;
    private String location;
    @NotNull
    private LocalDateTime eventDate;
}
