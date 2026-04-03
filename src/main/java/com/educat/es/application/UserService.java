package com.educat.es.application;

import com.educat.es.dto.request.UserRequest;
import com.educat.es.dto.response.UserResponse;
import java.util.List;

public interface UserService {
    List<UserResponse> findAll();
    UserResponse findById(Integer id);
    UserResponse save(UserRequest request);
    UserResponse update(Integer id, UserRequest request);
    void delete(Integer id);
}
