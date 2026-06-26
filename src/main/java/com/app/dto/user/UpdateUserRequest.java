package com.app.dto.user;

import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRequest {
    private String email;
    private String name;
    private String phoneNumber;
}
