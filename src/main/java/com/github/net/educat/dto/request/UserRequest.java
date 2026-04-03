package com.github.net.educat.dto.request;

import jakarta.validation.constraints.*;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class UserRequest {
    @NotBlank
    private String name;
    @NotBlank @Email
    private String email;
    @NotBlank @Size(min = 8)
    private String password;
    @NotNull
    private Integer roleId;
    private Boolean status;
}
