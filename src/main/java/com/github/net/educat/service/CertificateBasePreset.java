package com.github.net.educat.service;

import lombok.Getter;

import java.util.Map;

public class CertificateBasePreset {

    @Getter
    public static class Config {
        private final String displayName;
        private final String resourcePath;
        private final Map<String, FieldConfig> fields;

        public Config(String displayName, String resourcePath, Map<String, FieldConfig> fields) {
            this.displayName = displayName;
            this.resourcePath = resourcePath;
            this.fields = fields;
        }
    }

    @Getter
    public static class FieldConfig {
        private final float x;
        private final float y;
        private final float fontSize;
        private final String color;
        private final String alignment;
        private final float maxWidth;
        private final boolean bold;

        public FieldConfig(float x, float y, float fontSize, String color, String alignment, float maxWidth) {
            this(x, y, fontSize, color, alignment, maxWidth, false);
        }

        public FieldConfig(float x, float y, float fontSize, String color, String alignment, float maxWidth, boolean bold) {
            this.x = x;
            this.y = y;
            this.fontSize = fontSize;
            this.color = color;
            this.alignment = alignment;
            this.maxWidth = maxWidth;
            this.bold = bold;
        }
    }

    // All PDFs are landscape A4: 842.25 x 595.5
    // Coordinates below are tuned for each design based on typical certificate layout.
    public static final Map<String, Config> CONFIGS = Map.of(
        "pdf-modern-vintage", new Config(
            "Modern Vintage (Ingles)",
            "certificate-bases/modern-vintage.pdf",
            Map.of(
                "header", new FieldConfig(421, 520, 32, "#2c1810", "center", 600, true),
                "subtitle", new FieldConfig(421, 470, 14, "#5c4a3d", "center", 600),
                "studentName", new FieldConfig(421, 400, 28, "#2c1810", "center", 600, true),
                "body", new FieldConfig(421, 340, 13, "#4a3b32", "center", 700),
                "footer", new FieldConfig(421, 130, 11, "#5c4a3d", "center", 600),
                "signature1", new FieldConfig(280, 90, 10, "#5c4a3d", "center", 200),
                "signature2", new FieldConfig(562, 90, 10, "#5c4a3d", "center", 200)
            )
        ),
        "pdf-vintage-beige-dorado", new Config(
            "Diploma Vintage Beige y Dorado",
            "certificate-bases/vintage-beige-dorado.pdf",
            Map.of(
                "header", new FieldConfig(421, 510, 34, "#1a3a6b", "center", 600, true),
                "subtitle", new FieldConfig(421, 460, 14, "#4a4a4a", "center", 600),
                "studentName", new FieldConfig(421, 390, 26, "#1a3a6b", "center", 600, true),
                "body", new FieldConfig(421, 330, 13, "#333333", "center", 700),
                "footer", new FieldConfig(421, 130, 11, "#666666", "center", 600),
                "signature1", new FieldConfig(280, 85, 10, "#666666", "center", 200),
                "signature2", new FieldConfig(562, 85, 10, "#666666", "center", 200)
            )
        ),
        "pdf-negro-dorado", new Config(
            "Reconocimiento Negro y Dorado",
            "certificate-bases/negro-dorado.pdf",
            Map.of(
                "header", new FieldConfig(421, 520, 32, "#c8962e", "center", 600, true),
                "subtitle", new FieldConfig(421, 470, 14, "#d4af37", "center", 600),
                "studentName", new FieldConfig(421, 400, 28, "#c8962e", "center", 600, true),
                "body", new FieldConfig(421, 340, 13, "#e0e0e0", "center", 700),
                "footer", new FieldConfig(421, 130, 11, "#aaaaaa", "center", 600),
                "signature1", new FieldConfig(280, 90, 10, "#aaaaaa", "center", 200),
                "signature2", new FieldConfig(562, 90, 10, "#aaaaaa", "center", 200)
            )
        ),
        "pdf-beige-negro", new Config(
            "Diploma Elegante Beige y Negro",
            "certificate-bases/beige-negro.pdf",
            Map.of(
                "header", new FieldConfig(421, 520, 32, "#1a1a1a", "center", 600, true),
                "subtitle", new FieldConfig(421, 470, 14, "#333333", "center", 600),
                "studentName", new FieldConfig(421, 400, 28, "#1a1a1a", "center", 600, true),
                "body", new FieldConfig(421, 340, 13, "#2c2c2c", "center", 700),
                "footer", new FieldConfig(421, 130, 11, "#555555", "center", 600),
                "signature1", new FieldConfig(280, 90, 10, "#555555", "center", 200),
                "signature2", new FieldConfig(562, 90, 10, "#555555", "center", 200)
            )
        )
    );

    public static boolean isPdfPreset(String preset) {
        return preset != null && preset.startsWith("pdf-");
    }

    public static Config getConfig(String preset) {
        return CONFIGS.get(preset);
    }
}
