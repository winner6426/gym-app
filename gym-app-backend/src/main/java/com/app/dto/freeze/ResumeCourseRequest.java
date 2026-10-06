package com.app.dto.freeze;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class ResumeCourseRequest {
    private Long userId;
    private Long targetClassroomId;
    private LocalDate resumeDate;
}
