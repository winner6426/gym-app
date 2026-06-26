package com.app.dto.freeze;

import lombok.Getter;
import lombok.Setter;

import java.time.LocalDate;

@Getter
@Setter
public class FreezeRequestCreateRequest {
    private Long userId;
    private Long cardId;
    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
}
