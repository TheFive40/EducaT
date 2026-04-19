package com.github.net.educat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class StudentWellbeingContentResponse {
    private Map<String, List<WellbeingPublicationResponse>> postsBySection;
    private Map<String, List<WellbeingPublicationResponse>> articlesBySection;
    private Map<String, Object> catalog;
}

