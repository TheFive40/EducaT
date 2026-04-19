package com.github.net.educat.application;

import com.github.net.educat.dto.request.UserRequest;
import com.github.net.educat.dto.response.UserResponse;
import java.util.List;

public interface UserService {
    List<UserResponse> findAll();
    List<UserResponse> search(String query, Integer limit);
    UserResponse findById(Integer id);
    UserResponse save(UserRequest request);
    UserResponse update(Integer id, UserRequest request);
    void delete(Integer id);
}
