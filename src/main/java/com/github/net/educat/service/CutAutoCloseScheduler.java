package com.github.net.educat.service;

import com.github.net.educat.domain.*;
import com.github.net.educat.repository.*;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDate;
import java.util.*;

@Slf4j
@Component
@RequiredArgsConstructor
public class CutAutoCloseScheduler {

    private final InstitutionSettingsRepository institutionSettingsRepository;
    private final CourseRepository courseRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final GradeRepository gradeRepository;
    private final ObjectMapper objectMapper;

    @Scheduled(cron = "0 0 6 * * ?", zone = "America/Bogota")
    @Transactional
    public void autoCloseCuts() {
        log.info("Running auto-close cuts scheduler...");
        List<CutPeriod> periods = loadCutPeriods();
        if (periods.isEmpty()) {
            log.info("No cut periods configured.");
            return;
        }

        LocalDate today = LocalDate.now();
        for (CutPeriod period : periods) {
            if (period.endDate == null || period.endDate.isAfter(today)) continue;
            if (period.name == null || period.name.isBlank()) continue;

            List<Course> courses = courseRepository.findAll();
            for (Course course : courses) {
                try {
                    processCourseCut(course, period);
                } catch (Exception e) {
                    log.error("Error auto-closing cut {} for course {}", period.name, course.getId(), e);
                }
            }
        }
        log.info("Auto-close cuts scheduler finished.");
    }

    private void processCourseCut(Course course, CutPeriod period) {
        Map<String, List<Integer>> cutConfig = parseCutConfig(course.getCutConfigJson());
        List<Integer> unitIds = cutConfig.get(period.name);
        if (unitIds == null || unitIds.isEmpty()) return;

        List<Grade> existingCutGrades = gradeRepository.findByCourseId(course.getId()).stream()
                .filter(g -> "cut".equalsIgnoreCase(g.getSource())
                        && period.name.equalsIgnoreCase(g.getDescription() != null ? g.getDescription() : ""))
                .toList();
        if (!existingCutGrades.isEmpty()) return; // already closed

        List<Enrollment> enrollments = enrollmentRepository.findByCourseId(course.getId());
        if (enrollments.isEmpty()) return;

        List<Grade> allGrades = gradeRepository.findByCourseId(course.getId());
        for (Enrollment enrollment : enrollments) {
            Student student = enrollment.getStudent();
            if (student == null) continue;

            double sum = 0;
            for (Integer uid : unitIds) {
                double unitGrade = allGrades.stream()
                        .filter(g -> g.getStudent() != null && g.getStudent().getId().equals(student.getId())
                                && "unit".equalsIgnoreCase(g.getSource())
                                && uid.equals(g.getSourceUnitId()))
                        .mapToDouble(g -> g.getGrade() != null ? g.getGrade().doubleValue() : 0.0)
                        .max().orElse(0.0);
                sum += unitGrade;
            }
            double avg = sum / unitIds.size();
            BigDecimal finalGrade = BigDecimal.valueOf(avg).setScale(2, RoundingMode.HALF_UP);
            finalGrade = finalGrade.min(BigDecimal.TEN).max(BigDecimal.ZERO);

            Grade grade = Grade.builder()
                    .student(student)
                    .course(course)
                    .grade(finalGrade)
                    .description(period.name)
                    .source("cut")
                    .build();
            gradeRepository.save(grade);
        }
        log.info("Auto-closed cut {} for course {} with {} students", period.name, course.getId(), enrollments.size());
    }

    @SuppressWarnings("unchecked")
    private Map<String, List<Integer>> parseCutConfig(String json) {
        if (json == null || json.isBlank()) return Collections.emptyMap();
        try {
            return objectMapper.readValue(json, Map.class);
        } catch (Exception e) {
            return Collections.emptyMap();
        }
    }

    private List<CutPeriod> loadCutPeriods() {
        return institutionSettingsRepository.findAll().stream().findFirst()
                .map(s -> {
                    try {
                        String json = s.getCutPeriodsJson();
                        if (json == null || json.isBlank()) return Collections.<CutPeriod>emptyList();
                        return Arrays.asList(objectMapper.readValue(json, CutPeriod[].class));
                    } catch (Exception e) {
                        return Collections.<CutPeriod>emptyList();
                    }
                })
                .orElse(Collections.emptyList());
    }

    public static record CutPeriod(String name, LocalDate startDate, LocalDate endDate, LocalDate enabledFrom) {}
}
