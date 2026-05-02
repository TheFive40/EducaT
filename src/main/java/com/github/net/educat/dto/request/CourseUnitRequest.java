package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
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
public class CourseUnitRequest {
    @NotNull
    private Integer courseId;

    @NotBlank
    private String name;

    private String welcome;
    private String description;
    private String announcementsJson;
    private String activityIdsJson;
    private String examIdsJson;
    private String resourcesJson;
    private String forumsJson;
    private String glossariesJson;
}