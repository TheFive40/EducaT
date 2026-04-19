package com.github.net.educat.application;

import com.github.net.educat.domain.User;
import com.github.net.educat.dto.response.AccessConfigResponse;
import com.github.net.educat.dto.response.EffectiveAccessResponse;
import com.github.net.educat.dto.response.PortalAccessResponse;

import java.util.List;
import java.util.Set;

public interface AccessControlService {
    AccessConfigResponse getAccessConfig();
    List<String> saveRolePermissions(Integer roleId, List<String> permissions);
    List<String> saveUserPermissions(Integer userId, List<String> permissions);
    PortalAccessResponse saveUserPortalAccess(Integer userId, PortalAccessResponse access);
    EffectiveAccessResponse getEffectiveAccess(User user);
    Set<String> getGrantedAuthorities(User user);
}

