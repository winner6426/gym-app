package com.app.dto.registration;

import lombok.Getter;
import lombok.Setter;

import java.util.List;

@Getter
@Setter
public class CreateRegistrationRequest {
    private Long userId;
    private Long classroomId;
    private List<AvailabilityRequest> availabilities;
    private String note;
}
