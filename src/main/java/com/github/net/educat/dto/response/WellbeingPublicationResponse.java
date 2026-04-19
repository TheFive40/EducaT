package com.github.net.educat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class WellbeingPublicationResponse {
    private String id;
    private String section;
    private String type;
    private String title;
    private String author;
    private String date;
    private String content;
    private String videoLink;
    private Map<String, Integer> reactions;
}

