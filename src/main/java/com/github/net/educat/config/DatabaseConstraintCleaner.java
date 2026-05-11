package com.github.net.educat.config;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.boot.CommandLineRunner;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Component;

import java.util.List;
import java.util.Map;

@Slf4j
@Component
@RequiredArgsConstructor
public class DatabaseConstraintCleaner implements CommandLineRunner {

    private final JdbcTemplate jdbcTemplate;

    @Override
    public void run(String... args) {
        cleanStaleConstraints("academic_grades");
        cleanStaleConstraints("academic_levels");
    }

    private void cleanStaleConstraints(String referencedTable) {
        try {
            String sql = """
                SELECT tc.constraint_name, tc.table_name
                FROM information_schema.table_constraints tc
                JOIN information_schema.constraint_column_usage ccu
                    ON tc.constraint_name = ccu.constraint_name
                    AND tc.table_schema = ccu.table_schema
                WHERE tc.constraint_type = 'FOREIGN KEY'
                  AND ccu.table_name = ?
                  AND tc.table_schema = 'public'
                  AND ccu.table_schema = 'public'
                """;

            List<Map<String, Object>> constraints = jdbcTemplate.queryForList(sql, referencedTable);

            for (Map<String, Object> row : constraints) {
                String constraintName = (String) row.get("constraint_name");
                String tableName = (String) row.get("table_name");
                if (constraintName == null || tableName == null) continue;

                try {
                    String dropSql = String.format(
                        "ALTER TABLE %s DROP CONSTRAINT IF EXISTS %s",
                        tableName, constraintName
                    );
                    jdbcTemplate.execute(dropSql);
                    log.info("Dropped stale constraint {} on table {} referencing {}",
                            constraintName, tableName, referencedTable);
                } catch (Exception ex) {
                    log.warn("Could not drop constraint {} on table {}: {}",
                            constraintName, tableName, ex.getMessage());
                }
            }
        } catch (Exception ex) {
            log.warn("Failed to clean stale constraints for {}: {}", referencedTable, ex.getMessage());
        }
    }
}
