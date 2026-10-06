package com.app.dto.makeup;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcessMakeupRequest {
    private Long staffId;
    private String status;
    private String staffNote;
}
