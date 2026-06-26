package com.app.dto.user;

import com.app.models.Role;
import lombok.Getter;
import lombok.Setter;

@Getter
@Setter
public class UpdateUserRoleRequest {
    private Role role;
}
