package com.app.dto.freeze;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class ProcessFreezeRequest {
    private Long staffId;
    private String status;
    private String staffNote;
}
