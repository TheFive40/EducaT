package com.educat.es.service;

import com.educat.es.domain.Role;
import com.educat.es.dto.request.RoleRequest;
import com.educat.es.dto.response.RoleResponse;
import com.educat.es.mapper.RoleMapper;
import com.educat.es.repository.RoleRepository;
import com.educat.es.application.RoleService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class RoleServiceImpl implements RoleService {
    private final RoleRepository roleRepository;
    private final RoleMapper roleMapper;

    @Override @Transactional(readOnly = true)
    public List<RoleResponse> findAll() {
        return roleRepository.findAll().stream().map(roleMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public RoleResponse findById(Integer id) {
        return roleRepository.findById(id).map(roleMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + id));
    }
    @Override
    public RoleResponse save(RoleRequest request) {
        Role role = roleMapper.toEntity(request);
        return roleMapper.toResponse(roleRepository.save(role));
    }
    @Override
    public RoleResponse update(Integer id, RoleRequest request) {
        Role role = roleRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Role not found: " + id));
        role.setName(request.getName());
        return roleMapper.toResponse(roleRepository.save(role));
    }
    @Override
    public void delete(Integer id) {
        if (!roleRepository.existsById(id)) throw new EntityNotFoundException("Role not found: " + id);
        roleRepository.deleteById(id);
    }
}
