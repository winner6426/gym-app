package com.app.dto.classroom;

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
public class ClassroomResponse {
    private Long id;
    private String code;
    private String name;
    private LocalDate recruitmentStartDate;
    private LocalDate recruitmentEndDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxCapacity;
    private Integer currentCapacity;
    private ClassroomStatus status;
    private Long courseId;
    private String courseName;
    private Level level;
    private Long centerId;
    private String centerName;
    private String province;
    private String address;
    private Long trainerId;
    private String trainerName;
    private String trainerEmail;
    private List<ScheduleResponse> schedules;
}
