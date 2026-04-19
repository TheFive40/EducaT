package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class AbsenceReportStatusRequest {
    @NotBlank
    private String status;

    @Size(max = 3000)
    private String reviewComment;

    @NotNull
    private Integer reviewerUserId;
}

