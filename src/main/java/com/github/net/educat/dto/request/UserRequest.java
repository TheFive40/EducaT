package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRequest {
    @NotBlank
    private String name;
    @NotBlank @Email
    private String email;
    @Size(min = 8)
    private String password;
    @Size(max = 40)
    private String documentId;
    @Size(max = 30)
    private String phone;
    private Integer roleId;
    private Boolean status;
}
