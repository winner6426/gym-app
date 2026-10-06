package com.app.dto.makeup;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class MakeupRequestCreateRequest {
    private Long userId;
    private Long cardId;
    private Long targetClassroomId;
    private LocalDate absenceDate;
    private String reason;
}
