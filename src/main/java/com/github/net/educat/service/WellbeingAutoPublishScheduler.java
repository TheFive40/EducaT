package com.github.net.educat.service;

import com.github.net.educat.application.WellbeingPublicationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;

@Slf4j
@Component
@RequiredArgsConstructor
public class WellbeingAutoPublishScheduler {

    private final WellbeingPublicationService wellbeingPublicationService;

    @Scheduled(cron = "0 0 * * * ?", zone = "America/Bogota")
    public void autoPublishOverduePublications() {
        log.info("Revisando publicaciones de bienestar vencidas para publicacion automatica...");
        try {
            wellbeingPublicationService.autoPublishOverdue();
            log.info("Revision de publicaciones de bienestar completada.");
        } catch (Exception e) {
            log.error("Error al publicar automaticamente publicaciones de bienestar", e);
        }
    }
}
