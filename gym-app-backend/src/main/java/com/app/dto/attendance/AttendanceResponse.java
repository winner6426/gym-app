package com.app.dto.attendance;

import com.app.models.ClassroomStatus;
import com.app.models.Level;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceResponse {
    private Long classroomId;
    private String classroomCode;
    private String classroomName;
    private String courseName;
    private Level level;
    private String centerName;
    private String province;
    private String trainerName;
    private LocalDate attendanceDate;
    private List<LocalDate> attendanceDates;
    private List<StudentAttendanceResponse> students;

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class ClassroomSummary {
        private Long id;
        private String code;
        private String name;
        private String courseName;
        private Level level;
        private String centerName;
        private String province;
        private LocalDate startDate;
        private LocalDate endDate;
        private Integer courseSession;
        private Integer maxCapacity;
        private Integer currentCapacity;
        private ClassroomStatus status;
        private List<String> schedules;
        private List<LocalDate> attendanceDates;
    }

    @Getter
    @Setter
    @Builder
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceResponse {
        private Long studentId;
        private String studentName;
        private String studentEmail;
        private String studentPhone;
        private Long registrationId;
        private Long cardId;
        private Integer totalSession;
        private Integer remainingSession;
        private Long attendanceId;
        private String attendanceStatus;
    }
}
