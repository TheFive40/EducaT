package com.github.net.educat.service;

import com.github.net.educat.application.AccessControlService;
import com.github.net.educat.domain.Role;
import com.github.net.educat.domain.RolePermission;
import com.github.net.educat.domain.User;
import com.github.net.educat.domain.UserPermission;
import com.github.net.educat.domain.UserPortalAccess;
import com.github.net.educat.dto.response.AccessConfigResponse;
import com.github.net.educat.dto.response.EffectiveAccessResponse;
import com.github.net.educat.dto.response.PermissionItemResponse;
import com.github.net.educat.dto.response.PortalAccessResponse;
import com.github.net.educat.repository.RolePermissionRepository;
import com.github.net.educat.repository.RoleRepository;
import com.github.net.educat.repository.UserPermissionRepository;
import com.github.net.educat.repository.UserPortalAccessRepository;
import com.github.net.educat.repository.UserRepository;
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
        labels.put("instructivos.crear", "Instructivos - Crear");
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

    private final RolePermissionRepository rolePermissionRepository;
    private final UserPermissionRepository userPermissionRepository;
    private final UserPortalAccessRepository userPortalAccessRepository;
    private final RoleRepository roleRepository;
    private final UserRepository userRepository;

    @Override
    @Transactional(readOnly = true)
    public AccessConfigResponse getAccessConfig() {
        return AccessConfigResponse.builder()
                .permissions(buildPermissionCatalog())
                .rolePerms(readRolePermissionsAll())
                .userPerms(readUserPermissionsAll())
                .userPortalAccess(readPortalAccessAll())
                .build();
    }

    @Override
    @Transactional
    public List<String> saveRolePermissions(Integer roleId, List<String> permissions) {
        rolePermissionRepository.deleteByRole_Id(roleId);
        List<String> sanitized = sanitizePermissions(permissions);
        Role role = roleRepository.findById(roleId)
                .orElseThrow(() -> new IllegalArgumentException("Role not found: " + roleId));
        for (String perm : sanitized) {
            rolePermissionRepository.save(RolePermission.builder()
                    .role(role)
                    .permissionKey(perm)
                    .build());
        }
        return sanitized;
    }

    @Override
    @Transactional
    public List<String> saveUserPermissions(Integer userId, List<String> permissions) {
        userPermissionRepository.deleteByUser_Id(userId);
        List<String> sanitized = sanitizePermissions(permissions);
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        for (String perm : sanitized) {
            userPermissionRepository.save(UserPermission.builder()
                    .user(user)
                    .permissionKey(perm)
                    .build());
        }
        return sanitized;
    }

    @Override
    @Transactional
    public PortalAccessResponse saveUserPortalAccess(Integer userId, PortalAccessResponse access) {
        User user = userRepository.findById(userId)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + userId));
        UserPortalAccess entity = userPortalAccessRepository.findByUser_Id(userId)
                .orElse(UserPortalAccess.builder().user(user).build());
        entity.setAdmin(access != null && access.isAdmin());
        entity.setTeacher(access != null && access.isTeacher());
        entity.setStudent(access != null && access.isStudent());
        userPortalAccessRepository.save(entity);
        return PortalAccessResponse.builder()
                .admin(entity.getAdmin())
                .teacher(entity.getTeacher())
                .student(entity.getStudent())
                .build();
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
        return rolePermissionRepository.findByRole_Id(user.getRole().getId()).stream()
                .map(RolePermission::getPermissionKey)
                .toList();
    }

    private List<String> resolveUserPermissions(User user) {
        if (user == null || user.getId() == null) return List.of();
        return userPermissionRepository.findByUser_Id(user.getId()).stream()
                .map(UserPermission::getPermissionKey)
                .toList();
    }

    private PortalAccessResponse resolveEffectivePortals(User user) {
        PortalAccessResponse byRole = resolveRoleDefaultPortals(user);
        if (user == null || user.getId() == null) return byRole;
        UserPortalAccess direct = userPortalAccessRepository.findByUser_Id(user.getId()).orElse(null);
        if (direct == null) return byRole;
        return PortalAccessResponse.builder()
                .admin(byRole.isAdmin() || Boolean.TRUE.equals(direct.getAdmin()))
                .teacher(byRole.isTeacher() || Boolean.TRUE.equals(direct.getTeacher()))
                .student(byRole.isStudent() || Boolean.TRUE.equals(direct.getStudent()))
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

    private Map<String, List<String>> readRolePermissionsAll() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        List<RolePermission> all = rolePermissionRepository.findAll();
        all.forEach(rp -> {
            String key = String.valueOf(rp.getRole().getId());
            result.computeIfAbsent(key, k -> new ArrayList<>()).add(rp.getPermissionKey());
        });
        return result;
    }

    private Map<String, List<String>> readUserPermissionsAll() {
        Map<String, List<String>> result = new LinkedHashMap<>();
        List<UserPermission> all = userPermissionRepository.findAll();
        all.forEach(up -> {
            String key = String.valueOf(up.getUser().getId());
            result.computeIfAbsent(key, k -> new ArrayList<>()).add(up.getPermissionKey());
        });
        return result;
    }

    private Map<String, PortalAccessResponse> readPortalAccessAll() {
        Map<String, PortalAccessResponse> result = new LinkedHashMap<>();
        List<UserPortalAccess> all = userPortalAccessRepository.findAll();
        all.forEach(upa -> {
            String key = String.valueOf(upa.getUser().getId());
            result.put(key, PortalAccessResponse.builder()
                    .admin(upa.getAdmin() != null && upa.getAdmin())
                    .teacher(upa.getTeacher() != null && upa.getTeacher())
                    .student(upa.getStudent() != null && upa.getStudent())
                    .build());
        });
        return result;
    }
}