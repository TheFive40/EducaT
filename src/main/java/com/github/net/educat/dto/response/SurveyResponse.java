package com.github.net.educat.dto.response;

import lombok.*;

import java.time.LocalDateTime;

@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SurveyResponse {
    private Integer id;
    private String question;
    private String optionsJson;
    private String rolesJson;
    private LocalDateTime startsAt;
    private LocalDateTime endsAt;
    private Boolean authRequired;
    private String questionMediaJson;
    private String voteLedgerJson;
    private String status;
    private LocalDateTime createdAt;
}