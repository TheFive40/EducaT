package com.github.net.educat.config;

import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.RolePermission;
import com.github.net.educat.repository.RolePermissionRepository;
import com.github.net.educat.repository.RoleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Set;

@Component
@RequiredArgsConstructor
public class DefaultAccessDataInitializer implements ApplicationRunner {
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

    private static final List<String> PROFESOR_DEFAULT_PERMISSIONS = List.of(
            P_TEACHER,
            "instructivos.crear",
            "instructivos.editar"
    );
    private static final List<String> ESTUDIANTE_DEFAULT_PERMISSIONS = List.of(P_STUDENT);

    private final RoleRepository roleRepository;
    private final RolePermissionRepository rolePermissionRepository;

    @Override
    @Transactional
    public void run(ApplicationArguments args) {
        Role adminRole = ensureRole(ROLE_ADMIN);
        Role profesorRole = ensureRole(ROLE_PROFESOR);
        Role estudianteRole = ensureRole(ROLE_ESTUDIANTE);

        seedRoleDefaults(adminRole, ADMIN_DEFAULT_PERMISSIONS);
        seedRoleDefaults(profesorRole, PROFESOR_DEFAULT_PERMISSIONS);
        seedRoleDefaults(estudianteRole, ESTUDIANTE_DEFAULT_PERMISSIONS);
    }

    private Role ensureRole(String roleName) {
        String normalized = normalizeRoleName(roleName);
        List<Role> existing = roleRepository.findAll();
        for (Role role : existing) {
            if (normalizeRoleName(role.getName()).equals(normalized)) {
                return role;
            }
        }
        return roleRepository.save(Role.builder().name(normalized).build());
    }

    private void seedRoleDefaults(Role role, List<String> defaultPermissions) {
        List<RolePermission> existing = rolePermissionRepository.findByRole_Id(role.getId());
        if (!existing.isEmpty()) return;
        List<String> unique = deduplicate(defaultPermissions);
        for (String perm : unique) {
            rolePermissionRepository.save(RolePermission.builder()
                    .role(role)
                    .permissionKey(perm)
                    .build());
        }
    }

    private List<String> deduplicate(List<String> values) {
        Set<String> unique = new LinkedHashSet<>();
        for (String value : values) {
            String normalized = value == null ? "" : value.trim();
            if (!normalized.isBlank()) unique.add(normalized);
        }
        return List.copyOf(unique);
    }

    private String normalizeRoleName(String roleName) {
        return (roleName == null ? "" : roleName).trim().toUpperCase(Locale.ROOT);
    }
}