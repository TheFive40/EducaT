package com.github.net.educat.repository;

import com.github.net.educat.domain.PsychologyAppointment;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;

@Repository
public interface PsychologyAppointmentRepository extends JpaRepository<PsychologyAppointment, Integer> {
    List<PsychologyAppointment> findByStudentIdOrderByAppointmentDateDesc(Integer studentId);
    List<PsychologyAppointment> findByProfessionalNameAndStatusOrderByAppointmentDateAsc(String professionalName, String status);
    List<PsychologyAppointment> findByAppointmentDateAndStatus(LocalDate date, String status);
    boolean existsByProfessionalNameAndAppointmentDateAndSlotAndStatus(String professionalName, LocalDate date, String slot, String status);
}
