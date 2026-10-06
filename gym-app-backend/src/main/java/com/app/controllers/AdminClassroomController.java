package com.app.controllers;

import com.app.dto.classroom.ClassroomRequest;
import com.app.dto.classroom.ClassroomResponse;
import com.app.dto.classroom.TrainerOptionResponse;
import com.app.models.ClassroomStatus;
import com.app.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/admin/classrooms")
@RequiredArgsConstructor
public class AdminClassroomController {

    private final ClassroomService classroomService;

    @GetMapping
    public List<ClassroomResponse> getAll(
            @RequestParam(required = false) Long centerId,
            @RequestParam(required = false) Long courseId,
            @RequestParam(required = false) ClassroomStatus status) {

        return classroomService.getAll(centerId, courseId, status);
    }

    @GetMapping("/trainers")
    public List<TrainerOptionResponse> getTrainers() {
        return classroomService.getAvailableTrainers();
    }

    @GetMapping("/{id}")
    public ClassroomResponse getById(@PathVariable Long id) {
        return classroomService.getById(id);
    }

    @PostMapping
    public ResponseEntity<ClassroomResponse> create(
            @RequestBody ClassroomRequest request) {

        return ResponseEntity.status(HttpStatus.CREATED)
                .body(classroomService.create(request));
    }

    @PutMapping("/{id}")
    public ClassroomResponse update(
            @PathVariable Long id,
            @RequestBody ClassroomRequest request) {

        return classroomService.update(id, request);
    }

    @PatchMapping("/{id}/status")
    public ClassroomResponse setStatus(
            @PathVariable Long id,
            @RequestParam ClassroomStatus status) {

        return classroomService.setStatus(id, status);
    }
}
