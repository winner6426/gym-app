package com.app.dto.course;

import com.app.models.Level;
import lombok.Getter;
import lombok.Setter;

import java.math.BigDecimal;

@Getter
@Setter
public class CourseRequest {
    private String name;
    private String description;
    private Integer session;
    private Level level;
    private BigDecimal price;
}