package com.app.dto.freeze;

import com.app.models.Level;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class FreezeRequestResponse {
    private Long id;
    private Long cardId;
    private Long registrationId;
    private Long studentId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private String classroomName;
    private String classroomCode;
    private String courseName;
    private Level level;
    private String centerName;
    private String province;
    private Long targetClassroomId;
    private String targetClassroomName;
    private String targetClassroomCode;
    private String targetCenterName;
    private String targetProvince;
    private Integer remainingSession;
    private LocalDate startDate;
    private LocalDate endDate;
    private LocalDate resumeDate;
    private String reason;
    private String staffNote;
    private String status;
}
