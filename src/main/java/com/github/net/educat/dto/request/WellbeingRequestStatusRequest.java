package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class WellbeingRequestStatusRequest {
    @NotBlank
    private String status;

    @Size(max = 3000)
    private String resolutionComment;
}

