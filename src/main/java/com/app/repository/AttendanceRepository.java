package com.app.repository;

import com.app.models.Attendance;
import com.app.models.Classroom;
import com.app.models.User;
import org.springframework.data.jpa.repository.JpaRepository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

public interface AttendanceRepository extends JpaRepository<Attendance, Long> {
    List<Attendance> findByStudent(User student);

    boolean existsByStudentId(Long studentId);

    List<Attendance> findByClassroom(Classroom classroom);

    List<Attendance> findByClassroomIdAndAttendanceDate(
            Long classroomId,
            LocalDate attendanceDate
    );

    Optional<Attendance> findByClassroomIdAndStudentIdAndAttendanceDate(
            Long classroomId,
            Long studentId,
            LocalDate attendanceDate
    );

    Optional<Attendance> findByCardIdAndClassroomIdAndAttendanceDate(
            Long cardId,
            Long classroomId,
            LocalDate attendanceDate
    );
}
