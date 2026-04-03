package com.github.net.educat.service;

import com.github.net.educat.domain.Attendance;
import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Student;
import com.github.net.educat.repository.AttendanceRepository;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.dto.request.AttendanceRequest;
import com.github.net.educat.dto.response.AttendanceResponse;
import com.github.net.educat.mapper.AttendanceMapper;
import com.github.net.educat.application.AttendanceService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AttendanceServiceImpl implements AttendanceService {
    private final AttendanceRepository attendanceRepository;
    private final StudentRepository studentRepository;
    private final CourseRepository courseRepository;
    private final AttendanceMapper attendanceMapper;

    @Override @Transactional(readOnly = true)
    public List<AttendanceResponse> findAll() {
        return attendanceRepository.findAll().stream().map(attendanceMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public AttendanceResponse findById(Integer id) {
        return attendanceRepository.findById(id).map(attendanceMapper::toResponse)
                .orElseThrow(() -> new EntityNotFoundException("Attendance not found: " + id));
    }
    @Override
    public AttendanceResponse save(AttendanceRequest request) {
        Student student = studentRepository.findById(request.getStudentId())
                .orElseThrow(() -> new EntityNotFoundException("Student not found: " + request.getStudentId()));
        Course course = courseRepository.findById(request.getCourseId())
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + request.getCourseId()));
        Attendance attendance = attendanceMapper.toEntity(request);
        attendance.setStudent(student);
        attendance.setCourse(course);
        return attendanceMapper.toResponse(attendanceRepository.save(attendance));
    }
    @Override
    public AttendanceResponse update(Integer id, AttendanceRequest request) {
        Attendance attendance = attendanceRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Attendance not found: " + id));
        attendance.setDate(request.getDate());
        attendance.setPresent(request.getPresent());
        return attendanceMapper.toResponse(attendanceRepository.save(attendance));
    }
    @Override
    public void delete(Integer id) {
        if (!attendanceRepository.existsById(id)) throw new EntityNotFoundException("Attendance not found: " + id);
        attendanceRepository.deleteById(id);
    }
    @Override @Transactional(readOnly = true)
    public List<AttendanceResponse> findByStudentId(Integer studentId) {
        return attendanceRepository.findByStudentId(studentId).stream().map(attendanceMapper::toResponse).toList();
    }
    @Override @Transactional(readOnly = true)
    public List<AttendanceResponse> findByCourseId(Integer courseId) {
        return attendanceRepository.findByCourseId(courseId).stream().map(attendanceMapper::toResponse).toList();
    }
}
