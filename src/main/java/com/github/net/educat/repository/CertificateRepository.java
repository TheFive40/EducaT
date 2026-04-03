package com.github.net.educat.repository;

import com.github.net.educat.domain.Certificate;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;
import java.util.List;

@Repository
public interface CertificateRepository extends JpaRepository<Certificate, Integer> {
    List<Certificate> findByStudentId(Integer studentId);
}
