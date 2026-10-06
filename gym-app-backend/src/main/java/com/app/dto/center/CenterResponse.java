package com.app.dto.center;

import lombok.Builder;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
@Builder
public class CenterResponse {
    private Long id;
    private String name;
    private String province;
    private String address;
    private String phone;
}
