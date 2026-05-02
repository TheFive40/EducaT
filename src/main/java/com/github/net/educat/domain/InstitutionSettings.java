package com.github.net.educat.domain;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "institution_settings")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class InstitutionSettings {
    @Id @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Integer id;
    @Column(nullable = false)
    private String name;
    private String logo;
    @Column(name = "primary_color")
    private String primaryColor;
    @Column(name = "secondary_color")
    private String secondaryColor;
    private String banner;
    @Column(name = "grade_policy_json", columnDefinition = "TEXT")
    private String gradePolicyJson;
    @Column(name = "enrollment_form_config_json", columnDefinition = "TEXT")
    private String enrollmentFormConfigJson;
    @Column(name = "wellbeing_catalog_json", columnDefinition = "TEXT")
    private String wellbeingCatalogJson;
    @Column(name = "assignment_rules_json", columnDefinition = "TEXT")
    private String assignmentRulesJson;
}
