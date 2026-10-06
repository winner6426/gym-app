package com.app.dto.registration;

import com.app.models.RegistrationStatus;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcessRegistrationRequest {
    private RegistrationStatus status;
    private Long classroomId;
    private String staffNote;
}
