package com.app.controllers.admin;

import com.app.dto.course.CourseRequest;
import com.app.dto.course.CourseResponse;
import com.app.service.CourseService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/admin/courses")
@RequiredArgsConstructor
public class AdminCourseController {

    private final CourseService courseService;

    @GetMapping
    public List<CourseResponse> getAll(@RequestParam(required = false) Boolean active) {
        return courseService.getAll(active);
    }

    @GetMapping("/{id}")
    public CourseResponse getById(@PathVariable Long id) {
        return courseService.getById(id);
    }

    @PostMapping
    public ResponseEntity<CourseResponse> create(@RequestBody CourseRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(courseService.create(request));
    }

    @PutMapping("/{id}")
    public CourseResponse update(
            @PathVariable Long id,
            @RequestBody CourseRequest request) {
        return courseService.update(id, request);
    }

    @PatchMapping("/{id}/active")
    public CourseResponse setActive(
            @PathVariable Long id,
            @RequestParam boolean active) {
        return courseService.setActive(id, active);
    }
}
