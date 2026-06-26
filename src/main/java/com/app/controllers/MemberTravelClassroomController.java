package com.app.controllers;

import com.app.dto.classroom.ClassroomResponse;
import com.app.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/member/travel-classrooms")
@RequiredArgsConstructor
public class MemberTravelClassroomController {

    private final ClassroomService classroomService;

    @GetMapping
    public List<ClassroomResponse> getTravelClassrooms(
            @RequestParam Long userId,
            @RequestParam(required = false) Long cardId,
            @RequestParam(required = false) String province) {
        return classroomService.getTravelOptions(userId, cardId, province);
    }
}
