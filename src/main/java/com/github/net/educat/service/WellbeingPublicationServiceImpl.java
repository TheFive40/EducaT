package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.AppStateService;
import com.github.net.educat.application.WellbeingPublicationService;
import com.github.net.educat.dto.request.WellbeingPublicationRequest;
import com.github.net.educat.dto.response.StudentWellbeingContentResponse;
import com.github.net.educat.dto.response.WellbeingPublicationResponse;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class WellbeingPublicationServiceImpl implements WellbeingPublicationService {
    private static final String PUBLICATIONS_KEY = "educat_wellbeing_publications";
    private static final String CATALOG_KEY = "educat_wellbeing_catalog";

    private static final Set<String> VALID_SECTIONS = Set.of(
            "psychology", "sports", "art", "orientation", "medical", "scholarships"
    );
    private static final Set<String> VALID_TYPES = Set.of("post", "article");

    private final AppStateService appStateService;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<WellbeingPublicationResponse> findAllPublications() {
        return readPublications();
    }

    @Override
    public WellbeingPublicationResponse createPublication(WellbeingPublicationRequest request) {
        List<WellbeingPublicationResponse> all = readPublications();
        WellbeingPublicationResponse created = normalizeForSave(
                WellbeingPublicationResponse.builder()
                        .id("wb-" + UUID.randomUUID().toString().replace("-", ""))
                        .section(request.getSection())
                        .type(request.getType())
                        .title(request.getTitle())
                        .author(request.getAuthor())
                        .date(request.getDate())
                        .content(request.getContent())
                        .videoLink(request.getVideoLink())
                        .reactions(defaultReactions())
                        .build(),
                false
        );
        all.add(0, created);
        writePublications(all);
        return created;
    }

    @Override
    public WellbeingPublicationResponse updatePublication(String id, WellbeingPublicationRequest request) {
        String safeId = String.valueOf(id == null ? "" : id).trim();
        List<WellbeingPublicationResponse> all = readPublications();
        int idx = -1;
        for (int i = 0; i < all.size(); i += 1) {
            if (safeId.equals(String.valueOf(all.get(i).getId()))) {
                idx = i;
                break;
            }
        }
        if (idx < 0) throw new EntityNotFoundException("Wellbeing publication not found: " + safeId);

        WellbeingPublicationResponse previous = all.get(idx);
        WellbeingPublicationResponse updated = normalizeForSave(
                WellbeingPublicationResponse.builder()
                        .id(previous.getId())
                        .section(request.getSection())
                        .type(request.getType())
                        .title(request.getTitle())
                        .author(request.getAuthor())
                        .date(request.getDate())
                        .content(request.getContent())
                        .videoLink(request.getVideoLink())
                        .reactions(previous.getReactions())
                        .build(),
                true
        );
        all.set(idx, updated);
        writePublications(all);
        return updated;
    }

    @Override
    public void deletePublication(String id) {
        String safeId = String.valueOf(id == null ? "" : id).trim();
        List<WellbeingPublicationResponse> all = readPublications();
        int before = all.size();
        all.removeIf(p -> safeId.equals(String.valueOf(p.getId())));
        if (all.size() == before) throw new EntityNotFoundException("Wellbeing publication not found: " + safeId);
        writePublications(all);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentWellbeingContentResponse getStudentContent() {
        try {
            List<WellbeingPublicationResponse> all = readPublications();
            Map<String, List<WellbeingPublicationResponse>> postsBySection = emptyGroupedPublications();
            Map<String, List<WellbeingPublicationResponse>> articlesBySection = emptyGroupedPublications();

            all.forEach(item -> {
                String section = String.valueOf(item.getSection());
                if (!VALID_SECTIONS.contains(section)) return;
                if ("article".equals(item.getType())) {
                    articlesBySection.get(section).add(item);
                } else {
                    postsBySection.get(section).add(item);
                }
            });

            return StudentWellbeingContentResponse.builder()
                    .postsBySection(postsBySection)
                    .articlesBySection(articlesBySection)
                    .catalog(readOrInitCatalog())
                    .build();
        } catch (Throwable ignored) {
            return StudentWellbeingContentResponse.builder()
                    .postsBySection(emptyGroupedPublications())
                    .articlesBySection(emptyGroupedPublications())
                    .catalog(defaultCatalog())
                    .build();
        }
    }

    private Map<String, List<WellbeingPublicationResponse>> emptyGroupedPublications() {
        Map<String, List<WellbeingPublicationResponse>> grouped = new LinkedHashMap<>();
        VALID_SECTIONS.forEach(section -> grouped.put(section, new ArrayList<>()));
        return grouped;
    }

    private List<WellbeingPublicationResponse> readPublications() {
        String raw = appStateService.findByKey(PUBLICATIONS_KEY);
        if (raw == null || raw.isBlank()) return new ArrayList<>();
        try {
            List<WellbeingPublicationResponse> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
            List<WellbeingPublicationResponse> normalized = new ArrayList<>();
            for (WellbeingPublicationResponse item : parsed == null ? List.<WellbeingPublicationResponse>of() : parsed) {
                if (item == null) continue;
                try {
                    normalized.add(normalizeForSave(item, true));
                } catch (IllegalArgumentException ignored) {
                    // Ignora registros inválidos para no romper la carga completa.
                }
            }
            normalized.sort((a, b) -> String.valueOf(b.getDate()).compareTo(String.valueOf(a.getDate())));
            return normalized;
        } catch (Exception e) {
            return new ArrayList<>();
        }
    }

    private void writePublications(List<WellbeingPublicationResponse> publications) {
        try {
            appStateService.upsert(PUBLICATIONS_KEY, objectMapper.writeValueAsString(publications == null ? List.of() : publications));
        } catch (Exception e) {
            throw new IllegalStateException("No fue posible persistir publicaciones de bienestar", e);
        }
    }

    private WellbeingPublicationResponse normalizeForSave(WellbeingPublicationResponse raw, boolean allowExistingDate) {
        String id = String.valueOf(raw.getId() == null ? "" : raw.getId()).trim();
        String section = normalizeSection(raw.getSection());
        String type = normalizeType(raw.getType());
        String title = normalizeRequired(raw.getTitle(), "title");
        String author = normalizeOptional(raw.getAuthor());
        String content = normalizeOptional(raw.getContent());
        String videoLink = normalizeOptional(raw.getVideoLink());

        String date = normalizeOptional(raw.getDate());
        if (date.isEmpty()) {
            date = LocalDate.now().toString();
        }
        if (!allowExistingDate || date.length() > 10) {
            date = date.substring(0, Math.min(10, date.length()));
        }

        if (id.isEmpty()) id = "wb-" + UUID.randomUUID().toString().replace("-", "");

        return WellbeingPublicationResponse.builder()
                .id(id)
                .section(section)
                .type(type)
                .title(title)
                .author(author)
                .date(date)
                .content(content)
                .videoLink(videoLink)
                .reactions(mergeReactions(raw.getReactions()))
                .build();
    }

    private String normalizeSection(String value) {
        String normalized = normalizeOptional(value).toLowerCase(Locale.ROOT);
        if (!VALID_SECTIONS.contains(normalized)) {
            throw new IllegalArgumentException("Invalid wellbeing section: " + value);
        }
        return normalized;
    }

    private String normalizeType(String value) {
        String normalized = normalizeOptional(value).toLowerCase(Locale.ROOT);
        if (!VALID_TYPES.contains(normalized)) {
            throw new IllegalArgumentException("Invalid wellbeing publication type: " + value);
        }
        return normalized;
    }

    private String normalizeRequired(String value, String field) {
        String normalized = normalizeOptional(value);
        if (normalized.isEmpty()) throw new IllegalArgumentException("Invalid wellbeing publication field: " + field);
        return normalized;
    }

    private String normalizeOptional(String value) {
        return String.valueOf(value == null ? "" : value).trim();
    }

    private Map<String, Integer> defaultReactions() {
        Map<String, Integer> values = new LinkedHashMap<>();
        values.put("like", 0);
        values.put("love", 0);
        values.put("clap", 0);
        return values;
    }

    private Map<String, Integer> mergeReactions(Map<String, Integer> raw) {
        Map<String, Integer> merged = defaultReactions();
        if (raw == null) return merged;
        raw.forEach((k, v) -> {
            String key = String.valueOf(k == null ? "" : k).trim().toLowerCase(Locale.ROOT);
            if (!merged.containsKey(key)) return;
            int safe = Math.max(0, v == null ? 0 : v);
            merged.put(key, safe);
        });
        return merged;
    }

    private Map<String, Object> readOrInitCatalog() {
        String raw = appStateService.findByKey(CATALOG_KEY);
        if (raw != null && !raw.isBlank()) {
            try {
                Map<String, Object> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
                if (parsed != null && !parsed.isEmpty()) return parsed;
            } catch (Throwable ignored) {
                // Se inicializa con valores por defecto en caso de parseo inválido.
            }
        }
        Map<String, Object> defaults = defaultCatalog();
        try {
            appStateService.upsert(CATALOG_KEY, objectMapper.writeValueAsString(defaults));
        } catch (Throwable ignored) {
            // Si falla la persistencia inicial, se devuelve el valor por defecto en memoria.
        }
        return defaults;
    }

    private Map<String, Object> defaultCatalog() {
        Map<String, Object> catalog = new LinkedHashMap<>();

        List<Map<String, Object>> psychologists = new ArrayList<>();
        psychologists.add(Map.of(
                "id", "ps1",
                "name", "Dra. Laura Sanchez",
                "specialty", "Ansiedad y manejo emocional",
                "dates", List.of(
                        Map.of("date", "2026-04-14", "slots", List.of("08:00", "09:00", "10:30")),
                        Map.of("date", "2026-04-16", "slots", List.of("14:00", "15:30"))
                )
        ));
        psychologists.add(Map.of(
                "id", "ps2",
                "name", "Msc. Camila Gomez",
                "specialty", "Orientacion familiar y academica",
                "dates", List.of(
                        Map.of("date", "2026-04-15", "slots", List.of("09:30", "11:00")),
                        Map.of("date", "2026-04-18", "slots", List.of("08:30", "10:00", "11:30"))
                )
        ));

        catalog.put("psychologists", psychologists);
        catalog.put("sportCalls", List.of(
                Map.of("id", "sc1", "title", "Convocatoria Seleccion de Futbol", "closeDate", "2026-04-20", "slots", 22),
                Map.of("id", "sc2", "title", "Convocatoria Atletismo (100m y 400m)", "closeDate", "2026-04-24", "slots", 15)
        ));
        catalog.put("workshops", List.of(
                Map.of("id", "wk1", "title", "Taller: Proyecto de vida", "date", "2026-04-19", "capacity", 45),
                Map.of("id", "wk2", "title", "Taller: Perfil profesional y hoja de vida", "date", "2026-04-26", "capacity", 35)
        ));
        catalog.put("scholarshipCalls", List.of(
                Map.of("id", "bc1", "title", "Beca por excelencia academica", "closeDate", "2026-04-30", "requirement", "Promedio >= 8.5"),
                Map.of("id", "bc2", "title", "Apoyo socioeconomico semestral", "closeDate", "2026-05-10", "requirement", "Estudio socioeconomico vigente")
        ));

        return catalog;
    }
}

