package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WellbeingPublicationRequest {
    @NotBlank
    private String section;

    @NotBlank
    private String type;

    @NotBlank
    private String title;

    private String author;
    private String date;
    private String content;
    private String videoLink;
}

