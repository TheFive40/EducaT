package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotNull;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class AppStateValueRequest {
    @NotNull
    private String value;
}

