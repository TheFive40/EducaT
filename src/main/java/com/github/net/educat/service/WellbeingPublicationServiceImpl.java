package com.github.net.educat.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.github.net.educat.application.WellbeingPublicationService;
import com.github.net.educat.domain.InstitutionSettings;
import com.github.net.educat.domain.WellbeingPublication;
import com.github.net.educat.dto.request.WellbeingPublicationRequest;
import com.github.net.educat.dto.response.StudentWellbeingContentResponse;
import com.github.net.educat.dto.response.WellbeingPublicationResponse;
import com.github.net.educat.repository.InstitutionSettingsRepository;
import com.github.net.educat.repository.WellbeingPublicationRepository;
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

@Service
@RequiredArgsConstructor
@Transactional
public class WellbeingPublicationServiceImpl implements WellbeingPublicationService {
    private static final String CATALOG_SETTINGS_KEY = "wellbeing_catalog";
    private static final Set<String> VALID_SECTIONS = Set.of(
            "psychology", "sports", "art", "orientation", "medical", "scholarships"
    );
    private static final Set<String> VALID_TYPES = Set.of("post", "article");

    private final WellbeingPublicationRepository publicationRepository;
    private final InstitutionSettingsRepository institutionSettingsRepository;
    private final ObjectMapper objectMapper;

    @Override
    @Transactional(readOnly = true)
    public List<WellbeingPublicationResponse> findAllPublications() {
        return publicationRepository.findAllByOrderByDateDesc().stream()
                .map(this::toResponse)
                .toList();
    }

    @Override
    public WellbeingPublicationResponse createPublication(WellbeingPublicationRequest request) {
        WellbeingPublication entity = normalizeForSave(
                WellbeingPublication.builder()
                        .section(normalizeSection(request.getSection()))
                        .type(normalizeType(request.getType()))
                        .title(normalizeRequired(request.getTitle(), "title"))
                        .author(normalizeOptional(request.getAuthor()))
                        .date(normalizeDate(request.getDate(), false))
                        .content(normalizeOptional(request.getContent()))
                        .videoLink(normalizeOptional(request.getVideoLink()))
                        .reactionsJson(defaultReactionsJson())
                        .build()
        );
        return toResponse(publicationRepository.save(entity));
    }

    @Override
    public WellbeingPublicationResponse updatePublication(String id, WellbeingPublicationRequest request) {
        Integer entityId = parseId(id);
        WellbeingPublication previous = publicationRepository.findById(entityId)
                .orElseThrow(() -> new EntityNotFoundException("Wellbeing publication not found: " + id));
        previous.setSection(normalizeSection(request.getSection()));
        previous.setType(normalizeType(request.getType()));
        previous.setTitle(normalizeRequired(request.getTitle(), "title"));
        previous.setAuthor(normalizeOptional(request.getAuthor()));
        previous.setDate(normalizeDate(request.getDate(), true));
        previous.setContent(normalizeOptional(request.getContent()));
        previous.setVideoLink(normalizeOptional(request.getVideoLink()));
        WellbeingPublication saved = publicationRepository.save(previous);
        return toResponse(saved);
    }

    @Override
    public void deletePublication(String id) {
        Integer entityId = parseId(id);
        if (!publicationRepository.existsById(entityId)) {
            throw new EntityNotFoundException("Wellbeing publication not found: " + id);
        }
        publicationRepository.deleteById(entityId);
    }

    @Override
    @Transactional(readOnly = true)
    public StudentWellbeingContentResponse getStudentContent() {
        List<WellbeingPublicationResponse> all = findAllPublications();
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
    }

    private WellbeingPublicationResponse toResponse(WellbeingPublication entity) {
        Map<String, Integer> reactions = parseReactions(entity.getReactionsJson());
        return WellbeingPublicationResponse.builder()
                .id(String.valueOf(entity.getId()))
                .section(entity.getSection())
                .type(entity.getType())
                .title(entity.getTitle())
                .author(entity.getAuthor())
                .date(entity.getDate())
                .content(entity.getContent())
                .videoLink(entity.getVideoLink())
                .reactions(reactions)
                .build();
    }

    private WellbeingPublication normalizeForSave(WellbeingPublication entity) {
        return entity;
    }

    private Integer parseId(String id) {
        String safeId = String.valueOf(id == null ? "" : id).trim();
        if (safeId.startsWith("wb-")) safeId = safeId.substring(3);
        try {
            return Integer.parseInt(safeId);
        } catch (NumberFormatException e) {
            throw new EntityNotFoundException("Wellbeing publication not found: " + id);
        }
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

    private String normalizeDate(String date, boolean allowExistingDate) {
        String d = normalizeOptional(date);
        if (d.isEmpty()) return LocalDate.now().toString();
        if (!allowExistingDate || d.length() > 10) d = d.substring(0, Math.min(10, d.length()));
        return d;
    }

    private String defaultReactionsJson() {
        Map<String, Integer> reactions = defaultReactions();
        try {
            return objectMapper.writeValueAsString(reactions);
        } catch (Exception e) {
            return "{\"like\":0,\"love\":0,\"clap\":0}";
        }
    }

    private Map<String, Integer> defaultReactions() {
        Map<String, Integer> values = new LinkedHashMap<>();
        values.put("like", 0);
        values.put("love", 0);
        values.put("clap", 0);
        return values;
    }

    private Map<String, Integer> parseReactions(String json) {
        if (json == null || json.isBlank()) return defaultReactions();
        try {
            Map<String, Integer> parsed = objectMapper.readValue(json, new TypeReference<>() {});
            Map<String, Integer> merged = defaultReactions();
            if (parsed != null) {
                parsed.forEach((k, v) -> {
                    String key = String.valueOf(k == null ? "" : k).trim().toLowerCase(Locale.ROOT);
                    if (merged.containsKey(key)) merged.put(key, Math.max(0, v == null ? 0 : v));
                });
            }
            return merged;
        } catch (Exception e) {
            return defaultReactions();
        }
    }

    private Map<String, List<WellbeingPublicationResponse>> emptyGroupedPublications() {
        Map<String, List<WellbeingPublicationResponse>> grouped = new LinkedHashMap<>();
        VALID_SECTIONS.forEach(section -> grouped.put(section, new ArrayList<>()));
        return grouped;
    }

    private Map<String, Object> readOrInitCatalog() {
        List<InstitutionSettings> settings = institutionSettingsRepository.findAll();
        if (!settings.isEmpty()) {
            String raw = settings.get(0).getWellbeingCatalogJson();
            if (raw != null && !raw.isBlank()) {
                try {
                    Map<String, Object> parsed = objectMapper.readValue(raw, new TypeReference<>() {});
                    if (parsed != null && !parsed.isEmpty()) return parsed;
                } catch (Throwable ignored) {
                }
            }
        }
        Map<String, Object> defaults = defaultCatalog();
        InstitutionSettings setting = settings.isEmpty()
                ? InstitutionSettings.builder().name("Default").build()
                : settings.get(0);
        setting.setWellbeingCatalogJson(toJson(defaults));
        institutionSettingsRepository.save(setting);
        return defaults;
    }

    private String toJson(Object value) {
        try {
            return objectMapper.writeValueAsString(value);
        } catch (Exception e) {
            return "{}";
        }
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