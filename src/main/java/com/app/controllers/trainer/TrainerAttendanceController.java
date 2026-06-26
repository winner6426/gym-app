package com.app.controllers.trainer;

import com.app.dto.attendance.AttendanceRequest;
import com.app.dto.attendance.AttendanceResponse;
import com.app.service.AttendanceService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@RequestMapping("/api/trainer")
@RequiredArgsConstructor
public class TrainerAttendanceController {

    private final AttendanceService attendanceService;

    @GetMapping("/classrooms")
    public List<AttendanceResponse.ClassroomSummary> getTrainerClassrooms(
            @RequestParam Long trainerId) {
        return attendanceService.getTrainerClassrooms(trainerId);
    }

    @GetMapping("/classrooms/{classroomId}/students")
    public AttendanceResponse getClassroomStudents(
            @PathVariable Long classroomId,
            @RequestParam Long trainerId,
            @RequestParam(required = false) LocalDate date) {
        return attendanceService.getClassroomStudents(trainerId, classroomId, date);
    }

    @PostMapping("/classrooms/{classroomId}/attendances")
    public AttendanceResponse saveAttendance(
            @PathVariable Long classroomId,
            @RequestBody AttendanceRequest request) {
        return attendanceService.saveAttendance(classroomId, request);
    }
}
