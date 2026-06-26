package com.app.dto.attendance;

import lombok.AllArgsConstructor;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
public class AttendanceRequest {
    private Long trainerId;
    private LocalDate attendanceDate;
    private List<StudentAttendanceRequest> records;

    @Getter
    @Setter
    @NoArgsConstructor
    @AllArgsConstructor
    public static class StudentAttendanceRequest {
        private Long studentId;
        private String status;
    }
}
