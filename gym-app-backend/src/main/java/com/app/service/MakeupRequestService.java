package com.app.service;

import com.app.dto.makeup.MakeupRequestCreateRequest;
import com.app.dto.makeup.MakeupRequestResponse;
import com.app.dto.makeup.ProcessMakeupRequest;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Attendance;
import com.app.models.Card;
import com.app.models.Classroom;
import com.app.models.ClassroomStatus;
import com.app.models.Course;
import com.app.models.MakeupRequest;
import com.app.models.Registration;
import com.app.models.RegistrationStatus;
import com.app.models.Schedule;
import com.app.repository.AttendanceRepository;
import com.app.repository.CardRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.MakeupRequestRepository;
import com.app.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.time.YearMonth;
import java.util.ArrayList;
import java.util.List;
import java.util.Set;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class MakeupRequestService {

    private final MakeupRequestRepository makeupRequestRepository;
    private final CardRepository cardRepository;
    private final ClassroomRepository classroomRepository;
    private final AttendanceRepository attendanceRepository;
    private final ClassroomService classroomService;
    private final ScheduleRepository scheduleRepository;

    @Transactional(readOnly = true)
    public List<MakeupRequestResponse> getMyRequests(Long userId) {
        if (userId == null) {
            throw new IllegalArgumentException("Thiếu thông tin học viên.");
        }
        return makeupRequestRepository.findByRegistrationUserIdOrderByCreatedAtDescIdDesc(userId)
                .stream()
                .filter(this::isVisibleRequest)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<MakeupRequestResponse> getAllRequests(String status) {
        String normalizedStatus = cleanText(status).toUpperCase();
        return makeupRequestRepository.findAll()
                .stream()
                .filter(request -> normalizedStatus.isBlank()
                        || normalizedStatus.equalsIgnoreCase(request.getStatus()))
                .filter(this::isVisibleRequest)
                .sorted((first, second) -> {
                    int createdCompare = second.getCreatedAt().compareTo(first.getCreatedAt());
                    return createdCompare != 0 ? createdCompare : second.getId().compareTo(first.getId());
                })
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public MakeupRequestResponse create(MakeupRequestCreateRequest request) {
        validateRequest(request);

        Card card = cardRepository.findById(request.getCardId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thẻ học viên có id: " + request.getCardId()
                ));
        if (!card.getRegistration().getUser().getId().equals(request.getUserId())) {
            throw new IllegalArgumentException("Thẻ học viên không thuộc tài khoản hiện tại.");
        }
        if (!"ACTIVE".equalsIgnoreCase(card.getStatus()) || card.getRemainingSession() <= 0) {
            throw new IllegalArgumentException("Thẻ học viên phải đang hoạt động và còn buổi tập.");
        }
        if (card.getRegistration().getStatus() == RegistrationStatus.CANCELLED) {
            throw new IllegalArgumentException("Lớp học đã hủy không thể xin học bù.");
        }

        Registration registration = card.getRegistration();
        Classroom sourceClassroom = resolveCurrentClassroom(card);
        Classroom targetClassroom = classroomRepository.findById(request.getTargetClassroomId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lớp học bù có id: " + request.getTargetClassroomId()
                ));

        validateAbsenceDate(card, sourceClassroom, request.getAbsenceDate());
        validateTargetClassroom(card, sourceClassroom, targetClassroom);
        validateMonthlyLimit(request.getUserId(), request.getAbsenceDate());

        Attendance attendance = attendanceRepository
                .findByCardIdAndClassroomIdAndAttendanceDate(
                        card.getId(),
                        sourceClassroom.getId(),
                        request.getAbsenceDate()
                )
                .or(() -> attendanceRepository.findByClassroomIdAndStudentIdAndAttendanceDate(
                        sourceClassroom.getId(),
                        request.getUserId(),
                        request.getAbsenceDate()
                ))
                .orElseGet(() -> Attendance.builder()
                        .student(registration.getUser())
                        .classroom(sourceClassroom)
                        .card(card)
                        .attendanceDate(request.getAbsenceDate())
                        .build());
        attendance.setCard(card);
        attendance.setStatus("ABSENT");
        attendanceRepository.save(attendance);

        MakeupRequest makeupRequest = MakeupRequest.builder()
                .registration(registration)
                .targetClassroom(targetClassroom)
                .absenceDate(request.getAbsenceDate())
                .reason(cleanText(request.getReason()))
                .status("PENDING")
                .build();

        return toResponse(makeupRequestRepository.save(makeupRequest));
    }

    @Transactional
    public MakeupRequestResponse process(Long id, ProcessMakeupRequest request) {
        if (request == null || request.getStaffId() == null) {
            throw new IllegalArgumentException("Thiếu thông tin nhân viên xử lý.");
        }

        String nextStatus = cleanText(request.getStatus()).toUpperCase();
        if (!List.of("APPROVED", "REJECTED", "COMPLETED").contains(nextStatus)) {
            throw new IllegalArgumentException("Trạng thái xử lý học bù không hợp lệ.");
        }

        MakeupRequest makeupRequest = makeupRequestRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy yêu cầu học bù có id: " + id
                ));
        if (!"PENDING".equalsIgnoreCase(makeupRequest.getStatus())
                && !"APPROVED".equalsIgnoreCase(makeupRequest.getStatus())) {
            throw new IllegalArgumentException("Yêu cầu học bù này không còn có thể xử lý.");
        }
        if ("COMPLETED".equals(nextStatus)
                && !"APPROVED".equalsIgnoreCase(makeupRequest.getStatus())) {
            throw new IllegalArgumentException("Chỉ yêu cầu đã duyệt mới có thể đánh dấu hoàn thành.");
        }

        makeupRequest.setStatus(nextStatus);
        makeupRequest.setStaffNote(cleanText(request.getStaffNote()));
        makeupRequest.setProcessedAt(LocalDateTime.now());
        return toResponse(makeupRequestRepository.save(makeupRequest));
    }

    private void validateRequest(MakeupRequestCreateRequest request) {
        if (request == null
                || request.getUserId() == null
                || request.getCardId() == null
                || request.getTargetClassroomId() == null) {
            throw new IllegalArgumentException("Thiếu thông tin học bù.");
        }
        if (request.getAbsenceDate() == null) {
            throw new IllegalArgumentException("Ngày báo nghỉ không được để trống.");
        }
        if (request.getAbsenceDate().isBefore(LocalDate.now().minusMonths(1))) {
            throw new IllegalArgumentException("Ngày báo nghỉ không được quá xa so với hiện tại.");
        }
        if (cleanText(request.getReason()).isBlank()) {
            throw new IllegalArgumentException("Lý do học bù không được để trống.");
        }
    }

    private void validateTargetClassroom(Card card, Classroom sourceClassroom, Classroom targetClassroom) {
        if (targetClassroom.getId().equals(sourceClassroom.getId())) {
            throw new IllegalArgumentException("Lớp học bù phải khác lớp hiện tại.");
        }
        if (!targetClassroom.getCourse().getId().equals(resolveCourse(card).getId())) {
            throw new IllegalArgumentException("Lớp học bù phải thuộc cùng khóa học.");
        }
        if (targetClassroom.getCurrentCapacity() >= targetClassroom.getMaxCapacity()) {
            throw new IllegalArgumentException("Lớp học bù đã đủ sĩ số.");
        }
        ClassroomStatus targetStatus = classroomService.resolveStatus(targetClassroom);
        if (targetStatus != ClassroomStatus.RECRUITING
                && targetStatus != ClassroomStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Lớp học bù không còn nhận học viên.");
        }
    }

    private void validateMonthlyLimit(Long userId, LocalDate absenceDate) {
        YearMonth month = YearMonth.from(absenceDate);
        long count = makeupRequestRepository.countByRegistrationUserIdAndAbsenceDateBetween(
                userId,
                month.atDay(1),
                month.atEndOfMonth()
        );
        if (count >= 1) {
            throw new IllegalArgumentException("Học viên chỉ được báo nghỉ/học bù tối đa 1 buổi trong 1 tháng.");
        }
    }

    private MakeupRequestResponse toResponse(MakeupRequest makeupRequest) {
        Registration registration = makeupRequest.getRegistration();
        Classroom targetClassroom = makeupRequest.getTargetClassroom();
        Card card = cardRepository.findByRegistration(registration).orElse(null);
        Classroom sourceClassroom = card == null ? registration.getClassroom() : resolveCurrentClassroom(card);

        return MakeupRequestResponse.builder()
                .id(makeupRequest.getId())
                .cardId(card == null ? null : card.getId())
                .sourceClassroomId(sourceClassroom.getId())
                .sourceClassroomName(sourceClassroom.getName())
                .targetClassroomId(targetClassroom.getId())
                .targetClassroomName(targetClassroom.getName())
                .targetCenterName(targetClassroom.getCenter().getName())
                .targetProvince(targetClassroom.getCenter().getProvince())
                .absenceDate(makeupRequest.getAbsenceDate())
                .reason(makeupRequest.getReason())
                .staffNote(makeupRequest.getStaffNote())
                .status(makeupRequest.getStatus())
                .createdAt(makeupRequest.getCreatedAt())
                .processedAt(makeupRequest.getProcessedAt())
                .build();
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }

    private Classroom resolveCurrentClassroom(Card card) {
        return card.getCurrentClassroom() != null
                ? card.getCurrentClassroom()
                : card.getRegistration().getClassroom();
    }

    private Course resolveCourse(Card card) {
        return card.getCourse() != null
                ? card.getCourse()
                : resolveCurrentClassroom(card).getCourse();
    }

    private boolean isVisibleRequest(MakeupRequest request) {
        if (request.getRegistration().getStatus() == RegistrationStatus.CANCELLED) {
            return false;
        }
        return cardRepository.findByRegistration(request.getRegistration())
                .map(card -> !"CANCELLED".equalsIgnoreCase(card.getStatus()))
                .orElse(true);
    }

    private void validateAbsenceDate(Card card, Classroom sourceClassroom, LocalDate absenceDate) {

        List<LocalDate> studyDates = buildStudyDates(sourceClassroom);
        int dateIndex = studyDates.indexOf(absenceDate);
        if (dateIndex < 0 || dateIndex < getClassroomSessionOffset(card)) {
            throw new IllegalArgumentException("Ngày báo nghỉ phải thuộc lịch tập của lớp hiện tại.");
        }
    }

    private int getClassroomSessionOffset(Card card) {
        return card.getClassroomSessionOffset() == null ? 0 : card.getClassroomSessionOffset();
    }

    private List<LocalDate> buildStudyDates(Classroom classroom) {
        if (classroom.getStartDate() == null || classroom.getCourse().getSession() == null) {
            return List.of();
        }

        Set<DayOfWeek> studyDays = scheduleRepository.findByClassroomId(classroom.getId())
                .stream()
                .map(Schedule::getDayOfWeek)
                .collect(Collectors.toSet());
        if (studyDays.isEmpty()) {
            return List.of();
        }

        int totalSessions = classroom.getCourse().getSession();
        List<LocalDate> dates = new ArrayList<>(totalSessions);
        LocalDate cursor = classroom.getStartDate();
        while (dates.size() < totalSessions) {
            if (studyDays.contains(cursor.getDayOfWeek())) {
                dates.add(cursor);
            }
            cursor = cursor.plusDays(1);
        }
        return dates;
    }
}
