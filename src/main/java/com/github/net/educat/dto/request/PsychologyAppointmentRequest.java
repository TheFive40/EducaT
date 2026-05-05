package com.github.net.educat.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychologyAppointmentRequest {
    @NotBlank
    private String professionalName;
    @NotBlank
    private String appointmentDate;
    @NotBlank
    private String slot;
    private String reason;
}
