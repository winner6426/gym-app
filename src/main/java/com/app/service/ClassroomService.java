package com.app.service;

import com.app.dto.classroom.ClassroomRequest;
import com.app.dto.classroom.ClassroomResponse;
import com.app.dto.classroom.ScheduleRequest;
import com.app.dto.classroom.ScheduleResponse;
import com.app.dto.classroom.TrainerOptionResponse;
import com.app.dto.card.CardResponse;
import com.app.exception.DuplicateResourceException;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Center;
import com.app.models.Card;
import com.app.models.Classroom;
import com.app.models.ClassroomStatus;
import com.app.models.Course;
import com.app.models.Role;
import com.app.models.Schedule;
import com.app.models.User;
import com.app.repository.CardRepository;
import com.app.repository.CenterRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.CourseRepository;
import com.app.repository.ScheduleRepository;
import com.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.DayOfWeek;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class ClassroomService {
    private final ClassroomRepository classroomRepository;
    private final ScheduleRepository scheduleRepository;
    private final CourseRepository courseRepository;
    private final CenterRepository centerRepository;
    private final UserRepository userRepository;
    private final CardRepository cardRepository;

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getAll(
            Long centerId,
            Long courseId,
            ClassroomStatus status) {

        return classroomRepository.findAll().stream()
                .filter(classroom -> centerId == null || classroom.getCenter().getId().equals(centerId))
                .filter(classroom -> courseId == null || classroom.getCourse().getId().equals(courseId))
                .filter(classroom -> status == null || resolveStatus(classroom) == status)
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getRecruiting() {
        LocalDate today = LocalDate.now();
        return classroomRepository.findAll()
                .stream()
                .filter(classroom -> resolveStatus(classroom) == ClassroomStatus.RECRUITING)
                .filter(classroom -> classroom.getRecruitmentStartDate() == null
                        || !today.isBefore(classroom.getRecruitmentStartDate()))
                .filter(classroom -> classroom.getRecruitmentEndDate() == null
                        || !today.isAfter(classroom.getRecruitmentEndDate()))
                .filter(classroom -> classroom.getCurrentCapacity()
                        < classroom.getMaxCapacity())
                .map(this::toResponse)
                .toList();
    }

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getTravelOptions(Long userId, Long cardId, String province) {
        if (userId == null) {
            throw new IllegalArgumentException("Thiếu thông tin học viên.");
        }

        LocalDate today = LocalDate.now();
        List<Card> cards = cardRepository.findByRegistrationUserIdOrderByIssuedDateDescIdDesc(userId)
                .stream()
                .filter(card -> cardId == null || card.getId().equals(cardId))
                .filter(card -> "ACTIVE".equalsIgnoreCase(card.getStatus()))
                .filter(card -> card.getRemainingSession() > 0)
                .filter(card -> card.getExpiredDate() == null || !card.getExpiredDate().isBefore(today))
                .toList();

        if (cards.isEmpty()) {
            return List.of();
        }

        Set<Long> currentClassroomIds = cards.stream()
                .map(card -> resolveCurrentClassroom(card).getId())
                .collect(java.util.stream.Collectors.toSet());
        Set<Long> availableCourseIds = cards.stream()
                .map(card -> resolveCourse(card).getId())
                .collect(java.util.stream.Collectors.toSet());
        String provinceFilter = province == null ? "" : province.trim();

        return classroomRepository.findAll().stream()
                .filter(classroom -> {
                    ClassroomStatus computedStatus = resolveStatus(classroom);
                    return computedStatus == ClassroomStatus.RECRUITING
                            || computedStatus == ClassroomStatus.IN_PROGRESS;
                })
                .filter(classroom -> !currentClassroomIds.contains(classroom.getId()))
                .filter(classroom -> availableCourseIds.contains(classroom.getCourse().getId()))
                .filter(classroom -> cards.stream()
                        .anyMatch(card -> classroom.getCourse().getId().equals(resolveCourse(card).getId())
                                && canContinueInClassroom(card, classroom)))
                .filter(classroom -> classroom.getCurrentCapacity() < classroom.getMaxCapacity())
                .filter(classroom -> provinceFilter.isBlank()
                        || classroom.getCenter().getProvince().equalsIgnoreCase(provinceFilter))
                .sorted(Comparator
                        .comparing((Classroom classroom) -> classroom.getCenter().getProvince())
                        .thenComparing(classroom -> classroom.getCenter().getName())
                        .thenComparing(Classroom::getStartDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public CardResponse transferCardToClassroom(Long userId, Long cardId, Long targetClassroomId) {
        if (userId == null || cardId == null || targetClassroomId == null) {
            throw new IllegalArgumentException("Thieu thong tin hoc vien, the hoc hoac lop muon chuyen.");
        }

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay the hoc vien co id: " + cardId));
        if (!card.getRegistration().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("The hoc vien khong thuoc tai khoan hien tai.");
        }
        if (!"ACTIVE".equalsIgnoreCase(card.getStatus()) || card.getRemainingSession() <= 0) {
            throw new IllegalArgumentException("Chi the dang hoat dong va con buoi moi co the chuyen lop.");
        }

        Classroom currentClassroom = resolveCurrentClassroom(card);
        Classroom targetClassroom = findClassroom(targetClassroomId);
        Course currentCourse = resolveCourse(card);

        if (targetClassroom.getId().equals(currentClassroom.getId())) {
            throw new IllegalArgumentException("Lop moi phai khac lop hien tai.");
        }
        if (!targetClassroom.getCourse().getId().equals(currentCourse.getId())) {
            throw new IllegalArgumentException("Chi duoc chuyen sang lop khac trong cung khoa hoc.");
        }
        ClassroomStatus targetStatus = resolveStatus(targetClassroom);
        if (targetStatus != ClassroomStatus.RECRUITING && targetStatus != ClassroomStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Lop muon chuyen khong con nhan hoc vien.");
        }
        if (targetClassroom.getCurrentCapacity() >= targetClassroom.getMaxCapacity()) {
            throw new IllegalArgumentException("Lop muon chuyen da du si so.");
        }

        int effectiveSessionOffset = calculateEffectiveSessionOffset(card, targetClassroom);
        if (!canContinueInClassroom(card, targetClassroom)) {
            throw new IllegalArgumentException("Lop muon chuyen khong con ngay hoc phu hop voi so buoi da hoc.");
        }

        currentClassroom.setCurrentCapacity(Math.max(0, currentClassroom.getCurrentCapacity() - 1));
        targetClassroom.setCurrentCapacity(targetClassroom.getCurrentCapacity() + 1);
        card.setCourse(currentCourse);
        card.setCurrentClassroom(targetClassroom);
        card.setClassroomSessionOffset(effectiveSessionOffset);
        card.setRemainingSession(card.getSession() - effectiveSessionOffset);
        if (targetClassroom.getEndDate() != null) {
            card.setExpiredDate(targetClassroom.getEndDate());
        }

        classroomRepository.save(currentClassroom);
        classroomRepository.save(targetClassroom);
        return toCardResponse(cardRepository.save(card));
    }

    @Transactional(readOnly = true)
    public ClassroomResponse getById(Long id) {
        return toResponse(findClassroom(id));
    }

    @Transactional(readOnly = true)
    public List<TrainerOptionResponse> getAvailableTrainers() {
        return userRepository.findByRoleAndDisabledFalseOrderByNameAsc(Role.TRAINER)
                .stream()
                .map(user -> TrainerOptionResponse.builder()
                        .id(user.getId())
                        .name(user.getName())
                        .email(user.getEmail())
                        .build())
                .toList();
    }

    @Transactional
    public ClassroomResponse create(ClassroomRequest request) {
        validateRequest(request);

        String code = request.getCode().trim().toUpperCase();
        if(classroomRepository.existsByCodeIgnoreCase(code)) {
            throw new DuplicateResourceException("Mã lớp học đã tồn tại.");
        }

        Course course = findActiveCourse(request.getCourseId());
        Center center = findCenter(request.getCenterId());
        User trainer = findTrainer(request.getTrainerId());

        Classroom classroom = Classroom.builder()
                .code(code)
                .name(request.getName().trim())
                .course(course)
                .center(center)
                .trainer(trainer)
                .recruitmentStartDate(request.getRecruitmentStartDate())
                .recruitmentEndDate(request.getRecruitmentEndDate())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .maxCapacity(request.getMaxCapacity())
                .currentCapacity(0)
                .status(ClassroomStatus.RECRUITING)
                .build();

        Classroom saved = classroomRepository.save(classroom);
        saveSchedules(saved, request.getSchedules());
        return toResponse(saved);
    }

    @Transactional
    public ClassroomResponse update(Long id, ClassroomRequest request) {
        validateRequest(request);

        Classroom classroom = findClassroom(id);
        String code = request.getCode().trim().toUpperCase();

        if(classroomRepository.existsByCodeIgnoreCaseAndIdNot(code, id)) {
            throw new DuplicateResourceException("Mã lớp học đã tồn tại.");
        }
        if(request.getMaxCapacity() < classroom.getCurrentCapacity()) {
            throw new IllegalArgumentException(
                    "Sĩ số tối đa không thể nhỏ hơn số học viên hiện tại."
            );
        }

        Course nextCourse = findActiveCourse(request.getCourseId());
        if (!classroom.getCourse().getId().equals(nextCourse.getId())
                && classroom.getCurrentCapacity() != null
                && classroom.getCurrentCapacity() > 0) {
            throw new IllegalArgumentException(
                    "Khong the doi khoa hoc cua lop da co hoc vien."
            );
        }

        classroom.setCode(code);
        classroom.setName(request.getName().trim());
        classroom.setCourse(nextCourse);
        classroom.setCenter(findCenter(request.getCenterId()));
        classroom.setTrainer(findTrainer(request.getTrainerId()));
        classroom.setRecruitmentStartDate(request.getRecruitmentStartDate());
        classroom.setRecruitmentEndDate(request.getRecruitmentEndDate());
        classroom.setStartDate(request.getStartDate());
        classroom.setEndDate(request.getEndDate());
        classroom.setMaxCapacity(request.getMaxCapacity());
        Classroom saved = classroomRepository.save(classroom);
        scheduleRepository.deleteByClassroomId(id);
        scheduleRepository.flush();
        saveSchedules(saved, request.getSchedules());
        return toResponse(saved);
    }

    @Transactional
    public ClassroomResponse setStatus(Long id, ClassroomStatus status) {
        if(status == null) {
            throw new IllegalArgumentException("Trạng thái lớp không được để trống.");
        }

        Classroom classroom = findClassroom(id);
        if (status != ClassroomStatus.CANCELLED) {
            throw new IllegalArgumentException("Admin chi co the huy lop.");
        }
        classroom.setStatus(ClassroomStatus.CANCELLED);
        return toResponse(classroomRepository.save(classroom));
    }

    private void saveSchedules(Classroom classroom, List<ScheduleRequest> requests) {
        List<Schedule> schedules = requests.stream()
                .map(request -> Schedule.builder()
                        .classroom(classroom)
                        .dayOfWeek(request.getDayOfWeek())
                        .startTime(request.getStartTime())
                        .endTime(request.getEndTime())
                        .build())
                .toList();
        scheduleRepository.saveAll(schedules);
    }

    public ClassroomResponse toResponse(Classroom classroom) {
        List<ScheduleResponse> schedules =
                scheduleRepository.findByClassroomId(classroom.getId())
                        .stream()
                        .sorted(Comparator
                                .comparingInt((Schedule schedule) ->
                                        schedule.getDayOfWeek().getValue())
                                .thenComparing(Schedule::getStartTime))
                        .map(schedule -> ScheduleResponse.builder()
                                .id(schedule.getId())
                                .dayOfWeek(schedule.getDayOfWeek())
                                .startTime(schedule.getStartTime())
                                .endTime(schedule.getEndTime())
                                .build())
                        .toList();

        return ClassroomResponse.builder()
                .id(classroom.getId())
                .code(classroom.getCode())
                .name(classroom.getName())
                .recruitmentStartDate(classroom.getRecruitmentStartDate())
                .recruitmentEndDate(classroom.getRecruitmentEndDate())
                .startDate(classroom.getStartDate())
                .endDate(classroom.getEndDate())
                .maxCapacity(classroom.getMaxCapacity())
                .currentCapacity(classroom.getCurrentCapacity())
                .status(resolveStatus(classroom))
                .courseId(classroom.getCourse().getId())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerId(classroom.getCenter().getId())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .address(classroom.getCenter().getAddress())
                .trainerId(classroom.getTrainer().getId())
                .trainerName(classroom.getTrainer().getName())
                .trainerEmail(classroom.getTrainer().getEmail())
                .schedules(schedules)
                .build();
    }

    public ClassroomStatus resolveStatus(Classroom classroom) {
        if (classroom.getStatus() == ClassroomStatus.CANCELLED) {
            return ClassroomStatus.CANCELLED;
        }

        LocalDate today = LocalDate.now();
        if (classroom.getEndDate() != null && today.isAfter(classroom.getEndDate())) {
            return ClassroomStatus.COMPLETED;
        }
        if (classroom.getStartDate() != null && !today.isBefore(classroom.getStartDate())) {
            return ClassroomStatus.IN_PROGRESS;
        }
        return ClassroomStatus.RECRUITING;
    }

    private void validateRequest(ClassroomRequest request) {
        if(request == null) {
            throw new IllegalArgumentException("Dữ liệu lớp học không được để trống.");
        }
        if(isBlank(request.getCode())) {
            throw new IllegalArgumentException("Mã lớp không được để trống.");
        }
        if(isBlank(request.getName())) {
            throw new IllegalArgumentException("Tên lớp không được để trống.");
        }
        if(request.getCourseId() == null || request.getCenterId() == null || request.getTrainerId() == null) {
            throw new IllegalArgumentException(
                    "Khóa học, cơ sở và huấn luyện viên là bắt buộc."
            );
        }
        if(request.getMaxCapacity() == null || request.getMaxCapacity() <= 0) {
            throw new IllegalArgumentException("Sĩ số tối đa phải lớn hơn 0.");
        }
        if(request.getRecruitmentStartDate() == null
                || request.getRecruitmentEndDate() == null
                || request.getStartDate() == null
                || request.getEndDate() == null) {
            throw new IllegalArgumentException("Các mốc thời gian không được để trống.");
        }
        if(request.getRecruitmentStartDate().isAfter(request.getRecruitmentEndDate())) {
            throw new IllegalArgumentException(
                    "Ngày bắt đầu chiêu sinh phải trước ngày kết thúc chiêu sinh."
            );
        }
        if(request.getRecruitmentEndDate().isAfter(request.getStartDate())) {
            throw new IllegalArgumentException(
                    "Ngày kết thúc chiêu sinh không được sau ngày khai giảng."
            );
        }
        if(request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException(
                    "Ngày khai giảng phải trước ngày kết thúc lớp."
            );
        }
        validateSchedules(request.getSchedules());
    }

    private void validateSchedules(List<ScheduleRequest> schedules) {
        if(schedules == null || schedules.isEmpty()) {
            throw new IllegalArgumentException("Lớp học phải có ít nhất một lịch học.");
        }

        Set<DayOfWeek> usedDays = new HashSet<>();
        for(ScheduleRequest schedule : schedules) {
            if(schedule.getDayOfWeek() == null || schedule.getStartTime() == null || schedule.getEndTime() == null) {
                throw new IllegalArgumentException("Lịch học chưa đầy đủ.");
            }
            if(!schedule.getStartTime().isBefore(schedule.getEndTime())) {
                throw new IllegalArgumentException(
                        "Giờ bắt đầu phải trước giờ kết thúc."
                );
            }
            if (!usedDays.add(schedule.getDayOfWeek())) {
                throw new IllegalArgumentException(
                        "Mỗi thứ chỉ được khai báo một lịch học."
                );
            }
        }
    }

    private Classroom findClassroom(Long id) {
        return classroomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lớp học có id: " + id
                ));
    }

    private Course findActiveCourse(Long id) {
        Course course = courseRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy khóa học có id: " + id
                ));
        if (!course.isActive()) {
            throw new IllegalArgumentException("Khóa học đã tạm ngừng hoạt động.");
        }
        return course;
    }

    private Center findCenter(Long id) {
        return centerRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy cơ sở có id: " + id
                ));
    }

    private User findTrainer(Long id) {
        User trainer = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy huấn luyện viên có id: " + id
                ));
        if (trainer.getRole() != Role.TRAINER || trainer.isDisabled()) {
            throw new IllegalArgumentException(
                    "Tài khoản được chọn không phải huấn luyện viên đang hoạt động."
            );
        }
        return trainer;
    }

    private boolean isBlank(String value) {
        return value == null || value.isBlank();
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

    private CardResponse toCardResponse(Card card) {
        Classroom classroom = resolveCurrentClassroom(card);
        return CardResponse.builder()
                .id(card.getId())
                .registrationId(card.getRegistration().getId())
                .studentId(card.getRegistration().getUser().getId())
                .studentName(card.getRegistration().getUser().getName())
                .studentEmail(card.getRegistration().getUser().getEmail())
                .studentPhone(card.getRegistration().getUser().getPhoneNumber())
                .classroomId(classroom.getId())
                .classroomCode(classroom.getCode())
                .classroomName(classroom.getName())
                .courseId(resolveCourse(card).getId())
                .courseName(resolveCourse(card).getName())
                .level(resolveCourse(card).getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .trainerName(classroom.getTrainer().getName())
                .session(card.getSession())
                .remainingSession(card.getRemainingSession())
                .classroomSessionOffset(card.getClassroomSessionOffset())
                .issuedDate(card.getIssuedDate())
                .expiredDate(card.getExpiredDate())
                .status(card.getStatus())
                .registrationStatus(card.getRegistration().getStatus().name())
                .build();
    }

    private List<LocalDate> buildStudyDates(Classroom classroom) {
        if (classroom.getStartDate() == null || classroom.getCourse().getSession() == null) {
            return List.of();
        }

        Set<DayOfWeek> studyDays = scheduleRepository.findByClassroomId(classroom.getId())
                .stream()
                .map(Schedule::getDayOfWeek)
                .collect(java.util.stream.Collectors.toSet());
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

    private int countCompletedSessions(List<LocalDate> studyDates) {
        LocalDate today = LocalDate.now();
        return (int) studyDates.stream()
                .filter(date -> date.isBefore(today))
                .count();
    }

    private int calculateEffectiveSessionOffset(Card card, Classroom targetClassroom) {
        int memberProgressSession = Math.max(card.getSession() - card.getRemainingSession(), 0);
        int targetClassProgressSession = countCompletedSessions(buildStudyDates(targetClassroom));
        return Math.max(memberProgressSession, targetClassProgressSession);
    }

    private boolean canContinueInClassroom(Card card, Classroom targetClassroom) {
        int effectiveSessionOffset = calculateEffectiveSessionOffset(card, targetClassroom);
        int targetStudyDateCount = buildStudyDates(targetClassroom).size();
        return effectiveSessionOffset < card.getSession()
                && effectiveSessionOffset < targetStudyDateCount;
    }
}
