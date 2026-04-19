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
public class PortalAccessResponse {
    private boolean admin;
    private boolean teacher;
    private boolean student;
}

