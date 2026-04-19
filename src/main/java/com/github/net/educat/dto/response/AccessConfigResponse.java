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
public class AccessConfigResponse {
    private List<PermissionItemResponse> permissions;
    private Map<String, List<String>> rolePerms;
    private Map<String, List<String>> userPerms;
    private Map<String, PortalAccessResponse> userPortalAccess;
}

