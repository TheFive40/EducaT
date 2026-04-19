package com.github.net.educat.service;

import com.github.net.educat.application.AppStateService;
import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.response.EffectiveAccessResponse;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessControlServiceImplTest {

    @Mock
    private AppStateService appStateService;

    @Test
    void getEffectiveAccess_whenRoleIsAdmin_enablesAllPortalsByDefault() {
        when(appStateService.findByKey(anyString())).thenReturn(null);

        AccessControlServiceImpl service = new AccessControlServiceImpl(appStateService, new ObjectMapper());
        User user = User.builder()
                .id(10)
                .role(Role.builder().id(1).name("ADMIN").build())
                .build();

        EffectiveAccessResponse effective = service.getEffectiveAccess(user);

        assertTrue(effective.getPortals().isAdmin());
        assertTrue(effective.getPortals().isTeacher());
        assertTrue(effective.getPortals().isStudent());
        assertTrue(effective.getPermissions().contains("portal.admin"));
        assertTrue(effective.getPermissions().contains("portal.teacher"));
        assertTrue(effective.getPermissions().contains("portal.student"));
    }

    @Test
    void getGrantedAuthorities_whenRoleIsAdmin_returnsAllPortalAuthorities() {
        when(appStateService.findByKey(anyString())).thenReturn(null);

        AccessControlServiceImpl service = new AccessControlServiceImpl(appStateService, new ObjectMapper());
        User user = User.builder()
                .id(12)
                .role(Role.builder().id(2).name("ADMIN").build())
                .build();

        Set<String> authorities = service.getGrantedAuthorities(user);

        assertTrue(authorities.contains("PORTAL_ADMIN"));
        assertTrue(authorities.contains("PORTAL_TEACHER"));
        assertTrue(authorities.contains("PORTAL_STUDENT"));
    }
}

