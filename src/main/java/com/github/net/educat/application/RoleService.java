package com.github.net.educat.application;

import com.github.net.educat.dto.request.RoleRequest;
import com.github.net.educat.dto.response.RoleResponse;
import java.util.List;

public interface RoleService {
    List<RoleResponse> findAll();
    RoleResponse findById(Integer id);
    RoleResponse save(RoleRequest request);
    RoleResponse update(Integer id, RoleRequest request);
    void delete(Integer id);
}
