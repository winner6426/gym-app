package com.app.dto.makeup;

import com.app.models.Level;
import lombok.*;

import java.time.LocalDate;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ClassroomMakeupResponse {
    private Long id;
    private String code;
    private String name;
    private Long courseId;
    private String courseName;
    private Level level;
    private String centerName;
    private String province;
    private String trainerName;
    private LocalDate startDate;
    private LocalDate endDate;
    private Integer maxCapacity;
    private Integer currentCapacity;
    private List<String> schedules;
}
