package com.github.net.educat.service;

import com.github.net.educat.domain.Course;
import com.github.net.educat.domain.Enrollment;
import com.github.net.educat.domain.Student;
import com.github.net.educat.domain.Teacher;
import com.github.net.educat.dto.request.CourseJoinByCodeRequest;
import com.github.net.educat.dto.request.CourseRequest;
import com.github.net.educat.dto.response.CourseJoinByCodeResponse;
import com.github.net.educat.dto.response.CourseResponse;
import com.github.net.educat.mapper.CourseMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.EnrollmentRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.TeacherRepository;
import com.github.net.educat.application.CourseService;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final CourseMapper courseMapper;

    @Override
    public List<CourseResponse> findAll() {
        return courseRepository.findAll().stream().map(this::ensureCodeAndMap).toList();
    }
    @Override
    public CourseResponse findById(Integer id) {
        return courseRepository.findById(id).map(this::ensureCodeAndMap)
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + id));
    }
    @Override
    public CourseResponse save(CourseRequest request) {
        Course course = courseMapper.toEntity(request);
        if (request.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + request.getTeacherId()));
            course.setTeacher(teacher);
        }
        course.setCourseCode(generateUniqueCourseCode());
        return courseMapper.toResponse(courseRepository.save(course));
    }
    @Override
    public CourseResponse update(Integer id, CourseRequest request) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + id));
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        if (request.getTeacherId() == null) {
            course.setTeacher(null);
        } else {
            Teacher teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + request.getTeacherId()));
            course.setTeacher(teacher);
        }
        if (course.getCourseCode() == null || course.getCourseCode().isBlank()) {
            course.setCourseCode(generateUniqueCourseCode());
        }
        return courseMapper.toResponse(courseRepository.save(course));
    }
    @Override
    public void delete(Integer id) {
        if (!courseRepository.existsById(id)) throw new EntityNotFoundException("Course not found: " + id);
        courseRepository.deleteById(id);
    }
    @Override
    public List<CourseResponse> findByTeacherId(Integer teacherId) {
        return courseRepository.findByTeacherId(teacherId).stream().map(this::ensureCodeAndMap).toList();
    }

    @Override
    public List<CourseResponse> findAvailableForTeacher() {
        return courseRepository.findByTeacherIsNull().stream().map(this::ensureCodeAndMap).toList();
    }

    @Override
    public CourseJoinByCodeResponse joinByCode(CourseJoinByCodeRequest request) {
        String code = request.getCourseCode() == null ? "" : request.getCourseCode().trim();
        if (code.isEmpty()) {
            return CourseJoinByCodeResponse.builder()
                    .success(false)
                    .status("INVALID_CODE")
                    .message("Ingresa un código válido")
                    .build();
        }

        Course course = courseRepository.findByCourseCodeIgnoreCase(code).orElse(null);
        if (course == null) {
            return CourseJoinByCodeResponse.builder()
                    .success(false)
                    .status("COURSE_NOT_FOUND")
                    .message("No existe un curso con ese código")
                    .build();
        }

        String role = (request.getRole() == null ? "" : request.getRole()).toUpperCase(Locale.ROOT);
        if (role.contains("DOC") || role.contains("PROF") || role.contains("TEACH")) {
            Teacher teacher = teacherRepository.findByUserId(request.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Teacher not found for user: " + request.getUserId()));
            if (course.getTeacher() == null) {
                course.setTeacher(teacher);
                courseRepository.save(course);
                return CourseJoinByCodeResponse.builder()
                        .success(true)
                        .status("COURSE_CLAIMED")
                        .message("Ahora eres el docente tutor del curso")
                        .course(courseMapper.toResponse(course))
                        .build();
            }
            if (course.getTeacher().getId().equals(teacher.getId())) {
                return CourseJoinByCodeResponse.builder()
                        .success(true)
                        .status("ALREADY_OWNER")
                        .message("Ya estás asignado a este curso")
                        .course(courseMapper.toResponse(course))
                        .build();
            }
            return CourseJoinByCodeResponse.builder()
                    .success(false)
                    .status("COURSE_HAS_OWNER")
                    .message("El curso ya tiene un docente asignado")
                    .course(courseMapper.toResponse(course))
                    .build();
        }

        if (role.contains("EST") || role.contains("ALUM") || role.contains("STUD")) {
            Student student = studentRepository.findByUserId(request.getUserId())
                    .orElseThrow(() -> new EntityNotFoundException("Student not found for user: " + request.getUserId()));
            if (enrollmentRepository.existsByStudentIdAndCourseId(student.getId(), course.getId())) {
                return CourseJoinByCodeResponse.builder()
                        .success(true)
                        .status("ALREADY_ENROLLED")
                        .message("Ya estás matriculado en este curso")
                        .course(courseMapper.toResponse(course))
                        .build();
            }
            Enrollment enrollment = Enrollment.builder()
                    .student(student)
                    .course(course)
                    .enrollmentDate(LocalDateTime.now())
                    .build();
            enrollmentRepository.save(enrollment);
            return CourseJoinByCodeResponse.builder()
                    .success(true)
                    .status("ENROLLED")
                    .message("Te matriculaste correctamente en el curso")
                    .course(courseMapper.toResponse(course))
                    .build();
        }

        return CourseJoinByCodeResponse.builder()
                .success(false)
                .status("ROLE_NOT_SUPPORTED")
                .message("Rol no soportado para unión por código")
                .build();
    }

    private CourseResponse ensureCodeAndMap(Course course) {
        if (course.getCourseCode() == null || course.getCourseCode().isBlank()) {
            course.setCourseCode(generateUniqueCourseCode());
            course = courseRepository.save(course);
        }
        return courseMapper.toResponse(course);
    }

    private String generateUniqueCourseCode() {
        String code;
        do {
            code = "CUR-" + UUID.randomUUID().toString().replace("-", "").substring(0, 8).toUpperCase(Locale.ROOT);
        } while (courseRepository.existsByCourseCodeIgnoreCase(code));
        return code;
    }
}
