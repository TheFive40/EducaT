package com.github.net.educat.service;

import org.springframework.stereotype.Component;

import java.util.Map;

@Component
public class CertificateTemplateFactory {

    public Map<String, Object> createBaseConfig() {
        return Map.of(
                "headerText", "CERTIFICADO",
                "subtitleText", "La institucion educativa certifica que:",
                "bodyLinesJson", "[\"{{STUDENT_NAME}}\",\"Ha sido promovido(a) al grado: {{GRADE_NAME}}\",\"Curso: {{COURSE_NAME}} | Docente: {{TEACHER_NAME}}\",\"Promedio general: {{AVERAGE_GRADE}}\",\"Fecha de emision: {{DATE}}\"]",
                "footerText", "Fecha de emision: {{DATE}}",
                "styleConfigJson", "{\"headerFontSize\":32,\"headerColor\":\"#2c1810\",\"bodyFontSize\":14,\"bodyColor\":\"#4a3b32\",\"footerFontSize\":11,\"footerColor\":\"#5c4a3d\",\"alignment\":\"center\",\"preset\":\"pdf-modern-vintage\"}",
                "basePdfResource", "pdf-modern-vintage",
                "signatureLabel", "Firma del Director(a)"
        );
    }
}
