package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.application.AppStateService;
import com.github.net.educat.domain.User;
import com.github.net.educat.dto.response.AccessConfigResponse;
import com.github.net.educat.dto.response.EffectiveAccessResponse;
import com.github.net.educat.dto.response.PermissionItemResponse;
import com.github.net.educat.dto.response.PortalAccessResponse;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.ArrayList;
import java.util.Collections;
import java.util.LinkedHashMap;
import java.util.LinkedHashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class AccessControlServiceImpl implements AccessControlService {
    private static final String ROLE_PERMS_KEY = "educat_admin_role_permissions";
    private static final String USER_PERMS_KEY = "educat_admin_user_permissions";
    private static final String USER_PORTAL_ACCESS_KEY = "educat_admin_user_portal_access";

    private static final String P_ADMIN = "portal.admin";
    private static final String P_TEACHER = "portal.teacher";
    private static final String P_STUDENT = "portal.student";

    private static final Map<String, String> PERMISSION_LABELS;

    static {
        Map<String, String> labels = new LinkedHashMap<>();
        labels.put("cursos.crear", "Cursos - Crear");
        labels.put("cursos.editar", "Cursos - Editar");
        labels.put("cursos.eliminar", "Cursos - Eliminar");
        labels.put("cursos.asignar", "Cursos - Asignar estudiantes");
        labels.put("niveles.crear", "Niveles - Crear");
        labels.put("niveles.asignar", "Niveles - Asignar cursos/docentes");
        labels.put("roles.crear", "Roles - Crear");
        labels.put("roles.permisos", "Roles - Gestionar permisos");
        labels.put("certificados.emitir", "Certificados - Emitir");
        labels.put("certificados.eliminar", "Certificados - Eliminar");
        labels.put("instructivos.editar", "Instructivos - Editar");
        labels.put("formularios.editar", "Formularios - Editar");
        labels.put("formularios.reportes", "Formularios - Reportes");
        labels.put("notas.configurar", "Notas - Configurar politica");
        labels.put("bienestar.psicologia", "Bienestar - Apoyo Psicologico");
        labels.put("bienestar.deportes", "Bienestar - Actividad Fisica y Deportes");
        labels.put("bienestar.arte", "Bienestar - Arte y Cultura");
        labels.put("bienestar.orientacion", "Bienestar - Orientacion Vocacional");
        labels.put("bienestar.salud", "Bienestar - Servicio Medico y Salud");
        labels.put("bienestar.becas", "Bienestar - Apoyos Economicos y Becas");
        labels.put("bienestar.publicar", "Bienestar - Publicar");
        labels.put("bienestar.editar-publicacion", "Bienestar - Editar publicacion");
        labels.put("bienestar.eliminar-publicacion", "Bienestar - Eliminar publicacion");
        labels.put("bienestar.aprobar-publicacion", "Bienestar - Aprobar solicitud de publicacion");
        labels.put("bienestar.rechazar-publicacion", "Bienestar - Denegar solicitud de publicacion");
        labels.put("bienestar.eliminar-comentario", "Bienestar - Eliminar comentarios");
        labels.put("bienestar.eliminar-reaccion", "Bienestar - Eliminar reacciones");
        labels.put(P_ADMIN, "Acceso a Portal Administrador");
        labels.put(P_TEACHER, "Acceso a Portal Docente");
        labels.put(P_STUDENT, "Acceso a Portal Estudiante");
        PERMISSION_LABELS = Collections.unmodifiableMap(labels);
    }

    private final AppStateService appStateService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public AccessConfigResponse getAccessConfig() {
        return AccessConfigResponse.builder()
                .permissions(buildPermissionCatalog())
                .rolePerms(readPermissionsById(ROLE_PERMS_KEY))
                .userPerms(readPermissionsById(USER_PERMS_KEY))
                .userPortalAccess(readPortalAccessById())
                .build();
    }

    @Override
    @Transactional
    public List<String> saveRolePermissions(Integer roleId, List<String> permissions) {
        Map<String, List<String>> all = readPermissionsById(ROLE_PERMS_KEY);
        String key = String.valueOf(roleId);
        all.put(key, sanitizePermissions(permissions));
        writeJson(ROLE_PERMS_KEY, all);
        return all.get(key);
    }

    @Override
    @Transactional
    public List<String> saveUserPermissions(Integer userId, List<String> permissions) {
        Map<String, List<String>> all = readPermissionsById(USER_PERMS_KEY);
        String key = String.valueOf(userId);
        all.put(key, sanitizePermissions(permissions));
        writeJson(USER_PERMS_KEY, all);
        return all.get(key);
    }

    @Override
    @Transactional
    public PortalAccessResponse saveUserPortalAccess(Integer userId, PortalAccessResponse access) {
        Map<String, PortalAccessResponse> all = readPortalAccessById();
        String key = String.valueOf(userId);
        PortalAccessResponse saved = PortalAccessResponse.builder()
                .admin(access != null && access.isAdmin())
                .teacher(access != null && access.isTeacher())
                .student(access != null && access.isStudent())
                .build();
        all.put(key, saved);
        writeJson(USER_PORTAL_ACCESS_KEY, all);
        return saved;
    }

    @Override
    @Transactional(readOnly = true)
    public EffectiveAccessResponse getEffectiveAccess(User user) {
        PortalAccessResponse portals = resolveEffectivePortals(user);
        Set<String> permissions = new LinkedHashSet<>();
        permissions.addAll(resolveRolePermissions(user));
        permissions.addAll(resolveUserPermissions(user));
        if (portals.isAdmin()) permissions.add(P_ADMIN);
        if (portals.isTeacher()) permissions.add(P_TEACHER);
        if (portals.isStudent()) permissions.add(P_STUDENT);
        return EffectiveAccessResponse.builder()
                .permissions(new ArrayList<>(permissions))
                .portals(portals)
                .build();
    }

    @Override
    @Transactional(readOnly = true)
    public Set<String> getGrantedAuthorities(User user) {
        PortalAccessResponse portals = resolveEffectivePortals(user);
        Set<String> auth = new LinkedHashSet<>();
        if (portals.isAdmin()) auth.add("PORTAL_ADMIN");
        if (portals.isTeacher()) auth.add("PORTAL_TEACHER");
        if (portals.isStudent()) auth.add("PORTAL_STUDENT");
        return auth;
    }

    private List<PermissionItemResponse> buildPermissionCatalog() {
        return PERMISSION_LABELS.entrySet().stream()
                .map(e -> new PermissionItemResponse(e.getKey(), e.getValue()))
                .toList();
    }

    private List<String> resolveRolePermissions(User user) {
        if (user == null || user.getRole() == null || user.getRole().getId() == null) return List.of();
        Map<String, List<String>> byRole = readPermissionsById(ROLE_PERMS_KEY);
        return byRole.getOrDefault(String.valueOf(user.getRole().getId()), List.of());
    }

    private List<String> resolveUserPermissions(User user) {
        if (user == null || user.getId() == null) return List.of();
        Map<String, List<String>> byUser = readPermissionsById(USER_PERMS_KEY);
        return byUser.getOrDefault(String.valueOf(user.getId()), List.of());
    }

    private PortalAccessResponse resolveEffectivePortals(User user) {
        PortalAccessResponse byRole = resolveRoleDefaultPortals(user);
        if (user == null || user.getId() == null) return byRole;
        Map<String, PortalAccessResponse> byUser = readPortalAccessById();
        PortalAccessResponse direct = byUser.get(String.valueOf(user.getId()));
        if (direct == null) return byRole;
        return PortalAccessResponse.builder()
                .admin(byRole.isAdmin() || direct.isAdmin())
                .teacher(byRole.isTeacher() || direct.isTeacher())
                .student(byRole.isStudent() || direct.isStudent())
                .build();
    }

    private PortalAccessResponse resolveRoleDefaultPortals(User user) {
        String roleName = user != null && user.getRole() != null
                ? String.valueOf(user.getRole().getName()).toUpperCase(Locale.ROOT)
                : "";
        boolean admin = roleName.equals("ADMIN") || roleName.equals("ADMINISTRADOR");
        boolean teacher = admin || roleName.equals("DOCENTE") || roleName.equals("TEACHER") || roleName.equals("PROFESOR");
        boolean student = admin || roleName.equals("ESTUDIANTE") || roleName.equals("STUDENT");
        return PortalAccessResponse.builder().admin(admin).teacher(teacher).student(student).build();
    }

    private List<String> sanitizePermissions(List<String> permissions) {
        if (permissions == null) return List.of();
        return permissions.stream()
                .map(x -> x == null ? "" : x.trim())
                .filter(PERMISSION_LABELS::containsKey)
                .distinct()
                .toList();
    }

    private Map<String, List<String>> readPermissionsById(String key) {
        Map<String, List<String>> raw = readJson(key, new TypeReference<>() {});
        Map<String, List<String>> result = new LinkedHashMap<>();
        raw.forEach((id, values) -> result.put(String.valueOf(id), sanitizePermissions(values)));
        return result;
    }

    private Map<String, PortalAccessResponse> readPortalAccessById() {
        Map<String, PortalAccessResponse> raw = readJson(USER_PORTAL_ACCESS_KEY, new TypeReference<>() {});
        Map<String, PortalAccessResponse> result = new LinkedHashMap<>();
        raw.forEach((id, value) -> result.put(String.valueOf(id), PortalAccessResponse.builder()
                .admin(value != null && value.isAdmin())
                .teacher(value != null && value.isTeacher())
                .student(value != null && value.isStudent())
                .build()));
        return result;
    }

    private <T> Map<String, T> readJson(String key, TypeReference<Map<String, T>> typeReference) {
        String raw = appStateService.findByKey(key);
        if (raw == null || raw.isBlank()) return new LinkedHashMap<>();
        try {
            Map<String, T> parsed = objectMapper.readValue(raw, typeReference);
            return parsed == null ? new LinkedHashMap<>() : new LinkedHashMap<>(parsed);
        } catch (Exception e) {
            return new LinkedHashMap<>();
        }
    }

    private void writeJson(String key, Object value) {
        try {
            appStateService.upsert(key, objectMapper.writeValueAsString(value));
        } catch (Exception e) {
            throw new IllegalStateException("No fue posible persistir configuración de accesos", e);
        }
    }
}
