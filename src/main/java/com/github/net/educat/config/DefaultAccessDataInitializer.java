package com.github.net.educat.config;

import com.github.net.educat.application.AppStateService;
import com.github.net.educat.domain.Role;
import com.github.net.educat.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;
import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DefaultAccessDataInitializer implements ApplicationRunner {
    private static final String ROLE_PERMS_KEY = "educat_admin_role_permissions";

    private static final String ROLE_ADMIN = "ADMIN";
    private static final String ROLE_PROFESOR = "PROFESOR";
    private static final String ROLE_ESTUDIANTE = "ESTUDIANTE";

    private static final String P_ADMIN = "portal.admin";
    private static final String P_TEACHER = "portal.teacher";
    private static final String P_STUDENT = "portal.student";

    private static final List<String> ADMIN_DEFAULT_PERMISSIONS = List.of(
            "cursos.crear",
            "cursos.editar",
            "cursos.eliminar",
            "cursos.asignar",
            "niveles.crear",
            "niveles.asignar",
            "roles.crear",
            "roles.permisos",
            "certificados.emitir",
            "certificados.eliminar",
            "instructivos.editar",
            "formularios.editar",
            "formularios.reportes",
            "notas.configurar",
            "bienestar.psicologia",
            "bienestar.deportes",
            "bienestar.arte",
            "bienestar.orientacion",
            "bienestar.salud",
            "bienestar.becas",
            "bienestar.publicar",
            "bienestar.editar-publicacion",
            "bienestar.eliminar-publicacion",
            "bienestar.aprobar-publicacion",
            "bienestar.rechazar-publicacion",
            "bienestar.eliminar-comentario",
            "bienestar.eliminar-reaccion",
            P_ADMIN,
            P_TEACHER,
            P_STUDENT
    );

    private static final List<String> PROFESOR_DEFAULT_PERMISSIONS = List.of(P_TEACHER);
    private static final List<String> ESTUDIANTE_DEFAULT_PERMISSIONS = List.of(P_STUDENT);

    private final RoleRepository roleRepository;
    private final AppStateService appStateService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional
    @SuppressWarnings("nullness")
    public void run(ApplicationArguments args) {
        Map<String, Integer> defaultRoleIds = ensureDefaultRoles();
        seedDefaultRolePermissions(defaultRoleIds);
    }

    private Map<String, Integer> ensureDefaultRoles() {
        Map<String, Role> byName = new LinkedHashMap<>();
        roleRepository.findAll().forEach(role -> {
            String key = normalizeRoleName(role.getName());
            if (!key.isBlank() && !byName.containsKey(key)) {
                byName.put(key, role);
            }
        });

        ensureRoleExists(byName, ROLE_ADMIN);
        ensureRoleExists(byName, ROLE_PROFESOR);
        ensureRoleExists(byName, ROLE_ESTUDIANTE);

        Map<String, Integer> ids = new LinkedHashMap<>();
        ids.put(ROLE_ADMIN, byName.get(ROLE_ADMIN).getId());
        ids.put(ROLE_PROFESOR, byName.get(ROLE_PROFESOR).getId());
        ids.put(ROLE_ESTUDIANTE, byName.get(ROLE_ESTUDIANTE).getId());
        return ids;
    }

    private void ensureRoleExists(Map<String, Role> byName, String roleName) {
        if (byName.containsKey(roleName)) return;
        Role created = roleRepository.save(Role.builder().name(roleName).build());
        byName.put(roleName, created);
    }

    private void seedDefaultRolePermissions(Map<String, Integer> roleIds) {
        Map<String, List<String>> current = readRolePermissions();
        boolean changed = false;

        changed |= putRoleDefaultsIfMissing(current, roleIds.get(ROLE_ADMIN), ADMIN_DEFAULT_PERMISSIONS);
        changed |= putRoleDefaultsIfMissing(current, roleIds.get(ROLE_PROFESOR), PROFESOR_DEFAULT_PERMISSIONS);
        changed |= putRoleDefaultsIfMissing(current, roleIds.get(ROLE_ESTUDIANTE), ESTUDIANTE_DEFAULT_PERMISSIONS);

        if (!changed) return;
        writeRolePermissions(current);
    }

    private boolean putRoleDefaultsIfMissing(Map<String, List<String>> current, Integer roleId, List<String> defaults) {
        if (roleId == null) return false;
        String key = String.valueOf(roleId);
        if (current.containsKey(key)) return false;
        current.put(key, deduplicate(defaults));
        return true;
    }

    private List<String> deduplicate(List<String> values) {
        Set<String> unique = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = value == null ? "" : value.trim();
            if (!normalized.isBlank()) unique.add(normalized);
        }
        return new ArrayList<>(unique);
    }

    private Map<String, List<String>> readRolePermissions() {
        String raw = appStateService.findByKey(ROLE_PERMS_KEY);
        if (raw == null || raw.isBlank()) return new LinkedHashMap<>();
        try {
            Map<String, List<String>> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            return parsed == null ? new LinkedHashMap<>() : new LinkedHashMap<>(parsed);
        } catch (Exception ignored) {
            return new LinkedHashMap<>();
        }
    }

    private void writeRolePermissions(Map<String, List<String>> value) {
        try {
            appStateService.upsert(ROLE_PERMS_KEY, objectMapper.writeValueAsString(value));
        } catch (Exception e) {
            throw new IllegalStateException("No fue posible inicializar permisos por defecto", e);
        }
    }

    private String normalizeRoleName(String roleName) {
        return (roleName == null ? "" : roleName).trim().toUpperCase(Locale.ROOT);
    }
}

