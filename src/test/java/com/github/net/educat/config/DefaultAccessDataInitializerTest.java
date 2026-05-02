package com.github.net.educat.config;

import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.RolePermission;
import com.github.net.educat.repository.RolePermissionRepository;
import com.github.net.educat.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import java.util.ArrayList;
import java.util.List;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefaultAccessDataInitializerTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private RolePermissionRepository rolePermissionRepository;

    @Test
    void run_whenDataDoesNotExist_seedsDefaultRolesAndPermissions() {
        List<Role> persisted = new ArrayList<>();
        when(roleRepository.findAll()).thenAnswer(invocation -> new ArrayList<>(persisted));
        when(roleRepository.save(any(Role.class))).thenAnswer(invocation -> {
            Role role = invocation.getArgument(0);
            if (role.getId() == null) {
                role.setId(persisted.size() + 1);
            }
            persisted.add(role);
            return role;
        });
        when(rolePermissionRepository.findByRole_Id(any(Integer.class))).thenReturn(List.of());
        when(rolePermissionRepository.save(any(RolePermission.class))).thenAnswer(invocation -> {
            RolePermission rp = invocation.getArgument(0);
            return rp;
        });

        DefaultAccessDataInitializer initializer = new DefaultAccessDataInitializer(
                roleRepository,
                rolePermissionRepository
        );

        initializer.run(mock(org.springframework.boot.ApplicationArguments.class));

        assertEquals(3, persisted.size());
        assertEquals("ADMIN", persisted.get(0).getName());
        assertEquals("PROFESOR", persisted.get(1).getName());
        assertEquals("ESTUDIANTE", persisted.get(2).getName());
    }

    private static <T> T mock(Class<T> clazz) {
        return org.mockito.Mockito.mock(clazz);
    }
}