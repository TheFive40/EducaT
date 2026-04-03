package com.optical.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import lombok.*;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class RoleRequest {
    @NotBlank
    private String name;
}
