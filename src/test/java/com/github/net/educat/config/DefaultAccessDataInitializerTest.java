package com.github.net.educat.config;

import com.github.net.educat.application.AppStateService;
import com.github.net.educat.domain.Role;
import com.github.net.educat.repository.RoleRepository;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.List;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.eq;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class DefaultAccessDataInitializerTest {

    @Mock
    private RoleRepository roleRepository;

    @Mock
    private AppStateService appStateService;

    @Test
    void run_whenDataDoesNotExist_seedsDefaultRolesAndPermissions() throws Exception {
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
        when(appStateService.findByKey("educat_admin_role_permissions")).thenReturn(null);
        when(appStateService.upsert(eq("educat_admin_role_permissions"), any(String.class))).thenReturn("");

        DefaultAccessDataInitializer initializer = new DefaultAccessDataInitializer(
                roleRepository,
                appStateService,
                new ObjectMapper()
        );

        initializer.run(mock(org.springframework.boot.ApplicationArguments.class));

        assertEquals(3, persisted.size());
        assertEquals("ADMIN", persisted.get(0).getName());
        assertEquals("PROFESOR", persisted.get(1).getName());
        assertEquals("ESTUDIANTE", persisted.get(2).getName());

        ArgumentCaptor<String> payloadCaptor = ArgumentCaptor.forClass(String.class);
        verify(appStateService).upsert(eq("educat_admin_role_permissions"), payloadCaptor.capture());

        Map<String, List<String>> stored = new ObjectMapper().readValue(payloadCaptor.getValue(), new TypeReference<>() {});
        assertTrue(stored.get("1").contains("cursos.crear"));
        assertTrue(stored.get("1").contains("portal.admin"));
        assertTrue(stored.get("1").contains("portal.teacher"));
        assertTrue(stored.get("1").contains("portal.student"));
        assertEquals(List.of("portal.teacher"), stored.get("2"));
        assertEquals(List.of("portal.student"), stored.get("3"));
    }
}

