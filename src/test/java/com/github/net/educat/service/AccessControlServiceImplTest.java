package com.github.net.educat.service;

import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.RolePermission;
import com.github.net.educat.domain.User;
import com.github.net.educat.domain.UserPermission;
import com.github.net.educat.domain.UserPortalAccess;
import com.github.net.educat.dto.response.EffectiveAccessResponse;
import com.github.net.educat.repository.RolePermissionRepository;
import com.github.net.educat.repository.RoleRepository;
import com.github.net.educat.repository.UserPermissionRepository;
import com.github.net.educat.repository.UserPortalAccessRepository;
import com.github.net.educat.repository.UserRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.List;
import java.util.Optional;
import java.util.Set;

import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyInt;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class AccessControlServiceImplTest {

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Mock
    private UserPermissionRepository userPermissionRepository;

    @Mock
    private UserPortalAccessRepository userPortalAccessRepository;

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private UserRepository userRepository;

    @Test
    void getEffectiveAccess_whenRoleIsAdmin_enablesAllPortalsByDefault() {
        when(rolePermissionRepository.findByRole_Id(anyInt())).thenReturn(List.of(
                RolePermission.builder().permissionKey("portal.admin").build(),
                RolePermission.builder().permissionKey("portal.teacher").build(),
                RolePermission.builder().permissionKey("portal.student").build()
        ));
        when(userPermissionRepository.findByUser_Id(anyInt())).thenReturn(List.of());
        when(userPortalAccessRepository.findByUser_Id(anyInt())).thenReturn(Optional.empty());

        AccessControlServiceImpl service = new AccessControlServiceImpl(
                rolePermissionRepository, userPermissionRepository,
                userPortalAccessRepository, roleRepository, userRepository
        );
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
        when(rolePermissionRepository.findByRole_Id(anyInt())).thenReturn(List.of(
                RolePermission.builder().permissionKey("portal.admin").build(),
                RolePermission.builder().permissionKey("portal.teacher").build(),
                RolePermission.builder().permissionKey("portal.student").build()
        ));
        when(userPortalAccessRepository.findByUser_Id(anyInt())).thenReturn(Optional.empty());

        AccessControlServiceImpl service = new AccessControlServiceImpl(
                rolePermissionRepository, userPermissionRepository,
                userPortalAccessRepository, roleRepository, userRepository
        );
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