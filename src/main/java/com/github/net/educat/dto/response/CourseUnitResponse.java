package com.github.net.educat.dto.response;

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
public class CourseUnitResponse {
    private Integer id;
    private Integer courseId;
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