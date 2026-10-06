package com.app.dto.classroom;

import com.app.models.ClassroomStatus;
import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
public class ClassroomRequest {
    private String code;
    private String name;
    private Long courseId;
    private Long centerId;
    private Long trainerId;
    private LocalDate recruitmentStartDate;
    private LocalDate recruitmentEndDate;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxCapacity;
    private ClassroomStatus status;
    private List<ScheduleRequest> schedules;
}
