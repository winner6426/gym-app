package com.app.controllers.member;

import com.app.dto.makeup.*;
import com.app.service.MakeupService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/member/makeup")
@RequiredArgsConstructor
public class MemberMakeupController {

    private final MakeupService makeupService;

    // Lấy danh sách lớp học bù phù hợp (cùng trình độ, còn chỗ, khác lớp gốc)
    @GetMapping("/available-classrooms")
    public List<ClassroomMakeupResponse> getAvailableClassrooms(@RequestParam Long userId) {
        return makeupService.getAvailableClassroomsForMakeup(userId);
    }

    // Lấy lịch sử yêu cầu bù của học viên
    @GetMapping
    public List<MakeupRequestResponse> getMyMakeupRequests(@RequestParam Long userId) {
        return makeupService.getMyMakeupRequests(userId);
    }

    // Học viên gửi yêu cầu bù
    @PostMapping
    public MakeupRequestResponse create(@RequestBody MakeupRequestCreateRequest request) {
        return makeupService.create(request);
    }
}
