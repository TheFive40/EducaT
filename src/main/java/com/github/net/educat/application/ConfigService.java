package com.github.net.educat.application;

import com.github.net.educat.dto.response.ConfigResponse;

public interface ConfigService {
    ConfigResponse getGradePolicy();
    ConfigResponse saveGradePolicy(String policy);
    ConfigResponse getEnrollmentFormConfig();
    ConfigResponse saveEnrollmentFormConfig(String config);
    ConfigResponse getWellbeingCatalog();
    ConfigResponse saveWellbeingCatalog(String catalog);
    ConfigResponse getAssignmentRules();
    ConfigResponse saveAssignmentRules(String rules);
    ConfigResponse getCutPeriods();
    ConfigResponse saveCutPeriods(String periods);
    ConfigResponse getCourseGrades();
    ConfigResponse saveCourseGrades(String courseGrades);
    ConfigResponse getStudentGrades();
    ConfigResponse saveStudentGrades(String studentGrades);
    ConfigResponse getAboutContent();
    ConfigResponse saveAboutContent(String aboutContent);
}