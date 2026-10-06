package com.app.dto.center;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CenterRequest {
    private String name;
    private String province;
    private String address;
    private String phone;
}
