package com.app.service;

import com.app.dto.makeup.*;
import com.app.exception.ResourceNotFoundException;
import com.app.models.*;
import com.app.repository.*;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class MakeupService {

    private final MakeupRequestRepository makeupRequestRepository;
    private final CardRepository cardRepository;
    private final RegistrationRepository registrationRepository;
    private final ClassroomRepository classroomRepository;
    private final ScheduleRepository scheduleRepository;
    private final ClassroomService classroomService;

    @Transactional(readOnly = true)
    public List<ClassroomMakeupResponse> getAvailableClassroomsForMakeup(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Học viên không được để trống.");
        }

        // Tìm thẻ ACTIVE của user
        List<Card> activeCards = cardRepository
                .findByRegistrationUserIdOrderByIssuedDateDescIdDesc(userId)
                .stream()
                .filter(c -> "ACTIVE".equalsIgnoreCase(c.getStatus()))
                .toList();

        if (activeCards.isEmpty()) {
            return List.of();
        }

        // Lấy tất cả lớp gốc của user (để loại trừ)
        List<Long> ownClassroomIds = activeCards.stream()
                .map(c -> c.getRegistration().getClassroom().getId())
                .toList();

        // Lấy trình độ của thẻ active đầu tiên
        Level userLevel = activeCards.get(0).getRegistration().getClassroom().getCourse().getLevel();

        // Tìm lớp ACTIVE cùng trình độ, không phải lớp gốc, còn chỗ
        return classroomRepository.findAll()
                .stream()
                .filter(cl -> classroomService.resolveStatus(cl) == ClassroomStatus.IN_PROGRESS)
                .filter(cl -> cl.getCourse().getLevel() == userLevel)
                .filter(cl -> !ownClassroomIds.contains(cl.getId()))
                .filter(cl -> cl.getCurrentCapacity() < cl.getMaxCapacity())
                .map(this::toClassroomMakeupResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MakeupRequestResponse> getMyMakeupRequests(Long userId) {
        return makeupRequestRepository
                .findByRegistrationUserIdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MakeupRequestResponse> getAllPending() {
        return makeupRequestRepository
                .findByStatusOrderByCreatedAtAscIdAsc("PENDING")
                .stream()
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MakeupRequestResponse create(MakeupRequestCreateRequest request) {
        if (request == null
                || request.getUserId() == null
                || request.getCardId() == null
                || request.getTargetClassroomId() == null
                || request.getAbsenceDate() == null) {
            throw new IllegalArgumentException(
                    "Vui lòng điền đầy đủ thông tin yêu cầu bù buổi."
            );
        }

        Card card = cardRepository.findById(request.getCardId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thẻ học có id: " + request.getCardId()
                ));

        if (!card.getRegistration().getUser().getId().equals(request.getUserId())) {
            throw new IllegalArgumentException("Thẻ học không thuộc về học viên này.");
        }
        if (!"ACTIVE".equalsIgnoreCase(card.getStatus())) {
            throw new IllegalArgumentException("Chỉ thẻ đang hoạt động mới được xin học bù.");
        }

        Registration registration = card.getRegistration();

        Classroom targetClassroom = classroomRepository.findById(request.getTargetClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lớp học có id: " + request.getTargetClassroomId()
                ));

        if (classroomService.resolveStatus(targetClassroom) != ClassroomStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Lớp học bù phải đang hoạt động.");
        }
        if (targetClassroom.getId().equals(registration.getClassroom().getId())) {
            throw new IllegalArgumentException("Không thể chọn lớp gốc của mình để học bù.");
        }

        // Kiểm tra giới hạn 1 lần/tháng
        YearMonth month = YearMonth.from(request.getAbsenceDate());
        LocalDate startOfMonth = month.atDay(1);
        LocalDate endOfMonth = month.atEndOfMonth();

        long existingCount = makeupRequestRepository
                .countByRegistrationIdAndAbsenceDateBetween(
                        registration.getId(), startOfMonth, endOfMonth
                );
        if (existingCount >= 1) {
            throw new IllegalArgumentException(
                    "Chỉ được phép xin bù tối đa 1 buổi trong 1 tháng."
            );
        }

        MakeupRequest makeupRequest = MakeupRequest.builder()
                .registration(registration)
                .targetClassroom(targetClassroom)
                .absenceDate(request.getAbsenceDate())
                .reason(trimToNull(request.getReason()))
                .status("PENDING")
                .build();

        return toResponse(makeupRequestRepository.save(makeupRequest));
    }

    @Transactional
    public MakeupRequestResponse process(Long id, ProcessMakeupRequest request) {
        if (request == null || request.getStatus() == null) {
            throw new IllegalArgumentException("Trạng thái xử lý không được để trống.");
        }
        String newStatus = request.getStatus().toUpperCase();
        if (!"APPROVED".equals(newStatus) && !"REJECTED".equals(newStatus)) {
            throw new IllegalArgumentException(
                    "Trạng thái chỉ có thể là APPROVED hoặc REJECTED."
            );
        }

        MakeupRequest makeupRequest = makeupRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy yêu cầu học bù có id: " + id
                ));

        if (!"PENDING".equals(makeupRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu này đã được xử lý.");
        }

        makeupRequest.setStatus(newStatus);
        makeupRequest.setStaffNote(trimToNull(request.getStaffNote()));
        makeupRequest.setProcessedAt(LocalDateTime.now());

        return toResponse(makeupRequestRepository.save(makeupRequest));
    }

    // ──────────────── Mappers ────────────────

    private ClassroomMakeupResponse toClassroomMakeupResponse(Classroom classroom) {
        List<String> schedules = scheduleRepository.findByClassroomId(classroom.getId())
                .stream()
                .sorted(Comparator.comparing(Schedule::getDayOfWeek)
                        .thenComparing(Schedule::getStartTime))
                .map(s -> s.getDayOfWeek() + " " + s.getStartTime() + "-" + s.getEndTime())
                .toList();

        return ClassroomMakeupResponse.builder()
                .id(classroom.getId())
                .code(classroom.getCode())
                .name(classroom.getName())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .trainerName(classroom.getTrainer().getName())
                .startDate(classroom.getStartDate())
                .endDate(classroom.getEndDate())
                .maxCapacity(classroom.getMaxCapacity())
                .currentCapacity(classroom.getCurrentCapacity())
                .schedules(schedules)
                .build();
    }

    private MakeupRequestResponse toResponse(MakeupRequest req) {
        Registration reg = req.getRegistration();
        Long cardId = cardRepository.findByRegistrationId(reg.getId())
                .map(Card::getId)
                .orElse(null);

        return MakeupRequestResponse.builder()
                .id(req.getId())
                .cardId(cardId)
                .sourceClassroomId(reg.getClassroom().getId())
                .sourceClassroomName(reg.getClassroom().getName())
                .targetClassroomId(req.getTargetClassroom().getId())
                .targetClassroomName(req.getTargetClassroom().getName())
                .targetCenterName(req.getTargetClassroom().getCenter().getName())
                .targetProvince(req.getTargetClassroom().getCenter().getProvince())
                .absenceDate(req.getAbsenceDate())
                .reason(req.getReason())
                .staffNote(req.getStaffNote())
                .status(req.getStatus())
                .createdAt(req.getCreatedAt())
                .processedAt(req.getProcessedAt())
                .build();
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
