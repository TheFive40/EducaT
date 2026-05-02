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
import com.github.net.educat.mapper.StudentMapper;
import com.github.net.educat.repository.CourseRepository;
import com.github.net.educat.repository.EnrollmentRepository;
import com.github.net.educat.repository.ScheduleRepository;
import com.github.net.educat.repository.StudentRepository;
import com.github.net.educat.repository.TeacherRepository;
import com.github.net.educat.application.CourseService;
import com.github.net.educat.domain.Schedule;
import jakarta.persistence.EntityNotFoundException;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import java.time.LocalDateTime;
import java.time.LocalTime;
import java.util.List;
import java.util.Locale;
import java.util.UUID;
import java.util.Set;
import java.util.HashSet;

@Service
@RequiredArgsConstructor
@Transactional
public class CourseServiceImpl implements CourseService {
    private final CourseRepository courseRepository;
    private final TeacherRepository teacherRepository;
    private final StudentRepository studentRepository;
    private final EnrollmentRepository enrollmentRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourseMapper courseMapper;
    private final StudentMapper studentMapper;

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
        validateCourseScheduleWindow(request.getDefaultStartTime(), request.getDefaultEndTime());
        Course course = courseMapper.toEntity(request);
        if (request.getTeacherId() != null) {
            Teacher teacher = teacherRepository.findById(request.getTeacherId())
                    .orElseThrow(() -> new EntityNotFoundException("Teacher not found: " + request.getTeacherId()));
            course.setTeacher(teacher);
        }
        course.setDefaultScheduleDay(normalizeCourseScheduleDay(request.getDefaultScheduleDay()));
        course.setCourseCode(generateUniqueCourseCode());
        Course saved = courseRepository.save(course);
        String warning = syncCourseDefaultSchedule(saved);
        CourseResponse response = courseMapper.toResponse(saved);
        response.setScheduleWarning(warning);
        return response;
    }
    @Override
    public CourseResponse update(Integer id, CourseRequest request) {
        validateCourseScheduleWindow(request.getDefaultStartTime(), request.getDefaultEndTime());
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new EntityNotFoundException("Course not found: " + id));
        course.setName(request.getName());
        course.setDescription(request.getDescription());
        course.setDefaultScheduleDay(normalizeCourseScheduleDay(request.getDefaultScheduleDay()));
        course.setDefaultStartTime(request.getDefaultStartTime());
        course.setDefaultEndTime(request.getDefaultEndTime());
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
        Course saved = courseRepository.save(course);
        String warning = syncCourseDefaultSchedule(saved);
        CourseResponse response = courseMapper.toResponse(saved);
        response.setScheduleWarning(warning);
        return response;
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
        if (role.contains("ADMIN")) {
            return CourseJoinByCodeResponse.builder()
                    .success(true)
                    .status("ADMIN_BYPASS")
                    .message("Acceso administrativo concedido al curso")
                    .course(courseMapper.toResponse(course))
                    .build();
        }

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

    @Override
    public List<CourseResponse> findByCurrentUser(Integer userId) {
        // Get teacher associated with this user
        var teacher = teacherRepository.findByUserId(userId);
        // Get student associated with this user
        var student = studentRepository.findByUserId(userId);
        
        List<CourseResponse> courses = new java.util.ArrayList<>();
        
        // If user is a teacher, get courses they teach
        if (teacher.isPresent()) {
            courses.addAll(courseRepository.findByTeacherId(teacher.get().getId()).stream()
                    .map(this::ensureCodeAndMap).toList());
        }
        
        // If user is a student, get enrolled courses
        if (student.isPresent()) {
            courses.addAll(enrollmentRepository.findByStudentId(student.get().getId()).stream()
                    .map(e -> ensureCodeAndMap(e.getCourse())).toList());
        }
        
        return courses;
    }

    @Override
    public List<Object> getStudentsInCourse(Integer courseId) {
        return enrollmentRepository.findByCourseId(courseId).stream()
                .map(e -> e.getStudent())
                .map(studentMapper::toResponse)
                .map(s -> (Object) s)
                .toList();
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

    private void validateCourseScheduleWindow(LocalTime startTime, LocalTime endTime) {
        if (startTime == null && endTime == null) return;
        if (startTime == null || endTime == null) {
            throw new IllegalArgumentException("Debes definir hora de inicio y hora de fin juntas");
        }
        if (!endTime.isAfter(startTime)) {
            throw new IllegalArgumentException("La hora de fin debe ser mayor que la hora de inicio");
        }
    }

    private String normalizeCourseScheduleDay(String day) {
        String value = String.valueOf(day == null ? "" : day).trim();
        return value.isEmpty() ? "Lunes" : value;
    }

    private String syncCourseDefaultSchedule(Course course) {
        if (course == null || course.getTeacher() == null) return null;
        if (course.getDefaultStartTime() == null || course.getDefaultEndTime() == null) return null;

        String day = normalizeCourseScheduleDay(course.getDefaultScheduleDay());
        Schedule schedule = scheduleRepository.findFirstByCourseIdAndDayIgnoreCase(course.getId(), day)
                .orElseGet(() -> Schedule.builder().course(course).day(day).build());
        schedule.setCourse(course);
        schedule.setDay(day);
        schedule.setStartTime(course.getDefaultStartTime());
        schedule.setEndTime(course.getDefaultEndTime());
        scheduleRepository.save(schedule);
        return buildScheduleConflictWarning(course, schedule);
    }

    private String buildScheduleConflictWarning(Course course, Schedule schedule) {
        if (course == null || schedule == null) return null;
        String day = String.valueOf(schedule.getDay() == null ? "" : schedule.getDay()).trim();
        if (day.isEmpty()) return null;

        List<Schedule> teacherSchedules = scheduleRepository.findByTeacherId(course.getTeacher().getId()).stream()
                .filter(s -> s != null && s.getCourse() != null)
                .filter(s -> !s.getCourse().getId().equals(course.getId()))
                .filter(s -> day.equalsIgnoreCase(String.valueOf(s.getDay() == null ? "" : s.getDay()).trim()))
                .filter(s -> overlaps(schedule.getStartTime(), schedule.getEndTime(), s.getStartTime(), s.getEndTime()))
                .toList();

        Set<Integer> studentConflicts = new HashSet<>();
        enrollmentRepository.findByCourseId(course.getId()).forEach(enrollment -> {
            if (enrollment == null || enrollment.getStudent() == null || enrollment.getStudent().getId() == null) return;
            Integer studentId = enrollment.getStudent().getId();
            boolean hasConflict = scheduleRepository.findByStudentId(studentId).stream()
                    .filter(s -> s != null && s.getCourse() != null)
                    .filter(s -> !s.getCourse().getId().equals(course.getId()))
                    .filter(s -> day.equalsIgnoreCase(String.valueOf(s.getDay() == null ? "" : s.getDay()).trim()))
                    .anyMatch(s -> overlaps(schedule.getStartTime(), schedule.getEndTime(), s.getStartTime(), s.getEndTime()));
            if (hasConflict) studentConflicts.add(studentId);
        });

        if (teacherSchedules.isEmpty() && studentConflicts.isEmpty()) return null;
        return "Posibles choques detectados: docente=" + teacherSchedules.size() + ", estudiantes=" + studentConflicts.size();
    }

    private boolean overlaps(LocalTime startA, LocalTime endA, LocalTime startB, LocalTime endB) {
        if (startA == null || endA == null || startB == null || endB == null) return false;
        return startA.isBefore(endB) && endA.isAfter(startB);
    }
}
