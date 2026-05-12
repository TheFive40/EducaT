package com.github.net.educat.dto.response;

import lombok.*;
import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class EventResponse {
    private Integer id;
    private String title;
    private String coverImage;
    private String location;
    private LocalDateTime eventDate;
    private LocalDateTime createdAt;
}
