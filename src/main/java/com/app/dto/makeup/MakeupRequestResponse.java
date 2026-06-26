package com.app.dto.makeup;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.time.LocalDate;
import java.time.LocalDateTime;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class MakeupRequestResponse {
    private Long id;
    private Long cardId;
    private Long sourceClassroomId;
    private String sourceClassroomName;
    private Long targetClassroomId;
    private String targetClassroomName;
    private String targetCenterName;
    private String targetProvince;
    private LocalDate absenceDate;
    private String reason;
    private String staffNote;
    private String status;
    private LocalDateTime createdAt;
    private LocalDateTime processedAt;
}
