package com.app.service;

import com.app.dto.attendance.AttendanceRequest;
import com.app.dto.attendance.AttendanceResponse;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Attendance;
import com.app.models.Card;
import com.app.models.Classroom;
import com.app.models.ClassroomStatus;
import com.app.models.RegistrationStatus;
import com.app.models.Schedule;
import com.app.repository.AttendanceRepository;
import com.app.repository.CardRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.ScheduleRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.List;
import java.util.Map;
import java.util.Set;
import java.util.function.Function;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
public class AttendanceService {

    private static final String PRESENT = "PRESENT";
    private static final String ABSENT = "ABSENT";
    private static final List<RegistrationStatus> VISIBLE_ATTENDANCE_STATUSES = List.of(
            RegistrationStatus.ENROLLED,
            RegistrationStatus.CANCELLATION_REQUESTED
    );

    private final ClassroomRepository classroomRepository;
    private final AttendanceRepository attendanceRepository;
    private final CardRepository cardRepository;
    private final ScheduleRepository scheduleRepository;
    private final ClassroomService classroomService;

    @Transactional(readOnly = true)
    public List<AttendanceResponse.ClassroomSummary> getTrainerClassrooms(Long trainerId) {
        if (trainerId == null) {
            throw new IllegalArgumentException("Huấn luyện viên không được để trống.");
        }

        return classroomRepository.findByTrainerIdOrderByStartDateDescIdDesc(trainerId)
                .stream()
                .filter(classroom -> classroomService.resolveStatus(classroom) == ClassroomStatus.IN_PROGRESS)
                .map(this::toClassroomSummary)
                .toList();
    }

    @Transactional(readOnly = true)
    public AttendanceResponse getClassroomStudents(
            Long trainerId,
            Long classroomId,
            LocalDate attendanceDate) {

        Classroom classroom = getClassroomForTrainer(trainerId, classroomId);
        List<LocalDate> attendanceDates = buildAttendanceDates(classroom);
        LocalDate date = resolveAttendanceDate(attendanceDate, attendanceDates);

        List<Card> cards = findActiveCardsInClassroom(classroomId, attendanceDates, date);
        List<Attendance> existingAttendances = attendanceRepository
                .findByClassroomIdAndAttendanceDate(classroomId, date)
                .stream()
                .toList();
        Map<Long, Attendance> attendanceByCardId = existingAttendances
                .stream()
                .filter(attendance -> attendance.getCard() != null)
                .collect(Collectors.toMap(
                        attendance -> attendance.getCard().getId(),
                        Function.identity(),
                        (first, second) -> first
                ));
        Map<Long, Attendance> legacyAttendanceByStudentId = existingAttendances
                .stream()
                .filter(attendance -> attendance.getCard() == null && attendance.getStudent() != null)
                .collect(Collectors.toMap(
                        attendance -> attendance.getStudent().getId(),
                        Function.identity(),
                        (first, second) -> first
                ));

        List<AttendanceResponse.StudentAttendanceResponse> students = cards
                .stream()
                .map(card -> toStudentResponse(
                        card,
                        attendanceByCardId.getOrDefault(
                                card.getId(),
                                legacyAttendanceByStudentId.get(card.getRegistration().getUser().getId())
                        )
                ))
                .toList();

        return toAttendanceResponse(classroom, date, attendanceDates, students);
    }

    @Transactional
    public AttendanceResponse saveAttendance(
            Long classroomId,
            AttendanceRequest request) {

        if (request == null || request.getAttendanceDate() == null) {
            throw new IllegalArgumentException("Ngày điểm danh không được để trống.");
        }
        if (request.getRecords() == null || request.getRecords().isEmpty()) {
            throw new IllegalArgumentException("Danh sách điểm danh không được để trống.");
        }

        Classroom classroom = getClassroomForTrainer(request.getTrainerId(), classroomId);
        List<LocalDate> attendanceDates = buildAttendanceDates(classroom);
        if (!attendanceDates.contains(request.getAttendanceDate())) {
            throw new IllegalArgumentException("Ngày điểm danh không nằm trong lịch học của lớp.");
        }

        Map<Long, Card> cardByStudentId = findActiveCardsInClassroom(classroomId, attendanceDates, request.getAttendanceDate())
                .stream()
                .collect(Collectors.toMap(
                        card -> card.getRegistration().getUser().getId(),
                        Function.identity(),
                        (first, second) -> first
                ));

        for (AttendanceRequest.StudentAttendanceRequest record : request.getRecords()) {
            saveOneAttendance(
                    classroom,
                    request.getAttendanceDate(),
                    cardByStudentId,
                    record
            );
        }

        return getClassroomStudents(
                request.getTrainerId(),
                classroomId,
                request.getAttendanceDate()
        );
    }

    private List<Card> findActiveCardsInClassroom(
            Long classroomId,
            List<LocalDate> attendanceDates,
            LocalDate attendanceDate) {
        int attendanceIndex = attendanceDates.indexOf(attendanceDate);
        return cardRepository
                .findActiveCardsByEffectiveClassroomAndRegistrationStatuses(
                        classroomId,
                        VISIBLE_ATTENDANCE_STATUSES
                )
                .stream()
                .filter(card -> attendanceIndex < 0 || attendanceIndex >= getClassroomSessionOffset(card))
                .sorted(Comparator.comparing(
                        card -> safeText(card.getRegistration().getUser().getName())
                ))
                .toList();
    }

    private int getClassroomSessionOffset(Card card) {
        return card.getClassroomSessionOffset() == null ? 0 : card.getClassroomSessionOffset();
    }

    private void saveOneAttendance(
            Classroom classroom,
            LocalDate attendanceDate,
            Map<Long, Card> cardByStudentId,
            AttendanceRequest.StudentAttendanceRequest record) {

        if (record == null || record.getStudentId() == null) {
            throw new IllegalArgumentException("Học viên điểm danh không hợp lệ.");
        }

        String nextStatus = normalizeStatus(record.getStatus());
        Card card = cardByStudentId.get(record.getStudentId());
        if (card == null) {
            throw new IllegalArgumentException("Học viên không thuộc lớp đang điểm danh.");
        }

        Attendance attendance = attendanceRepository
                .findByCardIdAndClassroomIdAndAttendanceDate(
                        card.getId(),
                        classroom.getId(),
                        attendanceDate
                )
                .or(() -> attendanceRepository.findByClassroomIdAndStudentIdAndAttendanceDate(
                        classroom.getId(),
                        record.getStudentId(),
                        attendanceDate
                ))
                .orElseGet(() -> Attendance.builder()
                        .classroom(classroom)
                        .student(card.getRegistration().getUser())
                        .card(card)
                        .attendanceDate(attendanceDate)
                        .build());

        String previousStatus = attendance.getStatus();
        adjustRemainingSession(card, previousStatus, nextStatus);

        attendance.setClassroom(classroom);
        attendance.setStudent(card.getRegistration().getUser());
        attendance.setCard(card);
        attendance.setStatus(nextStatus);
        attendanceRepository.save(attendance);
        cardRepository.save(card);
    }

    private void adjustRemainingSession(
            Card card,
            String previousStatus,
            String nextStatus) {

        boolean wasRecorded = isRecordedAttendance(previousStatus);
        boolean willBeRecorded = isRecordedAttendance(nextStatus);

        if (!wasRecorded && willBeRecorded) {
            if (card.getRemainingSession() <= 0) {
                throw new IllegalArgumentException("Thẻ của học viên đã hết buổi tập.");
            }
            card.setRemainingSession(card.getRemainingSession() - 1);
        }
    }

    private boolean isRecordedAttendance(String status) {
        return PRESENT.equalsIgnoreCase(status) || ABSENT.equalsIgnoreCase(status);
    }

    private Classroom getClassroomForTrainer(Long trainerId, Long classroomId) {
        if (trainerId == null || classroomId == null) {
            throw new IllegalArgumentException("Huấn luyện viên và lớp học không được để trống.");
        }

        Classroom classroom = classroomRepository.findById(classroomId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lớp học có id: " + classroomId
                ));

        if (!classroom.getTrainer().getId().equals(trainerId)) {
            throw new IllegalArgumentException("Huấn luyện viên không phụ trách lớp này.");
        }
        if (classroomService.resolveStatus(classroom) != ClassroomStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Lớp học đã kết thúc hoặc chưa đến thời gian học, không thể điểm danh.");
        }

        return classroom;
    }

    private String normalizeStatus(String status) {
        if (status == null || status.isBlank()) {
            throw new IllegalArgumentException("Trạng thái điểm danh không được để trống.");
        }

        String normalized = status.trim().toUpperCase();
        if (!PRESENT.equals(normalized) && !ABSENT.equals(normalized)) {
            throw new IllegalArgumentException("Trạng thái điểm danh chỉ được là có mặt hoặc vắng.");
        }

        return normalized;
    }

    private AttendanceResponse.ClassroomSummary toClassroomSummary(Classroom classroom) {
        return AttendanceResponse.ClassroomSummary.builder()
                .id(classroom.getId())
                .code(classroom.getCode())
                .name(classroom.getName())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .startDate(classroom.getStartDate())
                .endDate(classroom.getEndDate())
                .courseSession(classroom.getCourse().getSession())
                .maxCapacity(classroom.getMaxCapacity())
                .currentCapacity(classroom.getCurrentCapacity())
                .status(classroomService.resolveStatus(classroom))
                .schedules(formatSchedules(classroom.getId()))
                .attendanceDates(buildAttendanceDates(classroom))
                .build();
    }

    private AttendanceResponse toAttendanceResponse(
            Classroom classroom,
            LocalDate attendanceDate,
            List<LocalDate> attendanceDates,
            List<AttendanceResponse.StudentAttendanceResponse> students) {

        return AttendanceResponse.builder()
                .classroomId(classroom.getId())
                .classroomCode(classroom.getCode())
                .classroomName(classroom.getName())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .trainerName(classroom.getTrainer().getName())
                .attendanceDate(attendanceDate)
                .attendanceDates(attendanceDates)
                .students(students)
                .build();
    }

    private AttendanceResponse.StudentAttendanceResponse toStudentResponse(
            Card card,
            Attendance attendance) {

        var registration = card.getRegistration();

        return AttendanceResponse.StudentAttendanceResponse.builder()
                .studentId(registration.getUser().getId())
                .studentName(registration.getUser().getName())
                .studentEmail(registration.getUser().getEmail())
                .studentPhone(registration.getUser().getPhoneNumber())
                .registrationId(registration.getId())
                .cardId(card.getId())
                .totalSession(card.getSession())
                .remainingSession(card.getRemainingSession())
                .attendanceId(attendance == null ? null : attendance.getId())
                .attendanceStatus(attendance == null ? null : attendance.getStatus())
                .build();
    }

    private List<String> formatSchedules(Long classroomId) {
        return scheduleRepository.findByClassroomId(classroomId)
                .stream()
                .sorted(Comparator
                        .comparing(Schedule::getDayOfWeek)
                        .thenComparing(Schedule::getStartTime))
                .map(schedule -> schedule.getDayOfWeek()
                        + " "
                        + schedule.getStartTime()
                        + "-"
                        + schedule.getEndTime())
                .toList();
    }

    private List<LocalDate> buildAttendanceDates(Classroom classroom) {
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

    private LocalDate resolveAttendanceDate(LocalDate requestedDate, List<LocalDate> attendanceDates) {
        if (attendanceDates.isEmpty()) {
            return requestedDate == null ? LocalDate.now() : requestedDate;
        }
        if (requestedDate == null) {
            LocalDate today = LocalDate.now();
            return attendanceDates.stream()
                    .filter(date -> !date.isBefore(today))
                    .findFirst()
                    .orElse(attendanceDates.get(attendanceDates.size() - 1));
        }
        if (!attendanceDates.contains(requestedDate)) {
            throw new IllegalArgumentException("Ngày điểm danh không nằm trong lịch học của lớp.");
        }
        return requestedDate;
    }

    private String safeText(String value) {
        return value == null ? "" : value;
    }
}
