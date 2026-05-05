package com.github.net.educat.dto.response;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDateTime;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class PsychologyAppointmentResponse {
    private Integer id;
    private Integer studentId;
    private String studentName;
    private String professionalName;
    private String appointmentDate;
    private String slot;
    private String reason;
    private String status;
    private LocalDateTime createdAt;
    private String resolutionComment;
}
