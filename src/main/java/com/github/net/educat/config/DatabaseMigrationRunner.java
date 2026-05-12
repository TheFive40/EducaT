package com.github.net.educat.config;

import lombok.RequiredArgsConstructor;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DatabaseMigrationRunner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        try {
            String sqlCerts = """
                DO $$
                BEGIN
                    IF EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'certificates'
                          AND column_name = 'file_path'
                          AND data_type = 'character varying'
                    ) THEN
                        ALTER TABLE certificates ALTER COLUMN file_path TYPE TEXT;
                    END IF;
                END $$;
                """;
            jdbcTemplate.execute(sqlCerts);
        } catch (Exception e) {
            // Si la tabla no existe todavia o ya es TEXT, ignorar
        }
        try {
            String sqlCut = """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'courses'
                          AND column_name = 'cut_config_json'
                    ) THEN
                        ALTER TABLE courses ADD COLUMN cut_config_json TEXT;
                    END IF;
                END $$;
                """;
            jdbcTemplate.execute(sqlCut);
        } catch (Exception e) {
            // Ignorar si ya existe o la tabla no existe aún
        }
        try {
            String sqlCutPeriods = """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'institution_settings'
                          AND column_name = 'cut_periods_json'
                    ) THEN
                        ALTER TABLE institution_settings ADD COLUMN cut_periods_json TEXT;
                    END IF;
                END $$;
                """;
            jdbcTemplate.execute(sqlCutPeriods);
        } catch (Exception e) {
            // Ignorar si ya existe o la tabla no existe aún
        }
        try {
            String sqlAboutContent = """
                DO $$
                BEGIN
                    IF NOT EXISTS (
                        SELECT 1 FROM information_schema.columns
                        WHERE table_name = 'institution_settings'
                          AND column_name = 'about_content_json'
                    ) THEN
                        ALTER TABLE institution_settings ADD COLUMN about_content_json TEXT;
                    END IF;
                END $$;
                """;
            jdbcTemplate.execute(sqlAboutContent);
        } catch (Exception e) {
            // Ignorar si ya existe o la tabla no existe aún
        }
    }
}
