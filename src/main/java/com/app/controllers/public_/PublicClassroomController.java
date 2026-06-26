package com.app.controllers.public_;

import com.app.dto.classroom.ClassroomResponse;
import com.app.service.ClassroomService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;

@RestController
@RequestMapping("/api/public/classrooms")
@RequiredArgsConstructor
public class PublicClassroomController {

    private final ClassroomService classroomService;

    @GetMapping
    public List<ClassroomResponse> getRecruitingClasses() {
        return classroomService.getRecruiting();
    }
}
