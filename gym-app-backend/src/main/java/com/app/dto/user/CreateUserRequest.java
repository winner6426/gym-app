package com.app.dto.user;

import com.app.models.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class CreateUserRequest {
    private String email;
    private String password;
    private String name;
    private String phoneNumber;
    private Role role;
}
