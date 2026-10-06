package com.app.service;

import com.app.dto.registration.AvailabilityRequest;
import com.app.dto.registration.AvailabilityResponse;
import com.app.dto.registration.CreateRegistrationRequest;
import com.app.dto.registration.ProcessRegistrationRequest;
import com.app.dto.registration.RefundInfo;
import com.app.dto.registration.RegistrationResponse;
import com.app.exception.ResourceNotFoundException;
import com.app.models.*;
import com.app.repository.CardRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.PaymentRepository;
import com.app.repository.RegistrationAvailabilityRepository;
import com.app.repository.RegistrationRepository;
import com.app.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.DayOfWeek;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.EnumSet;
import java.util.List;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class RegistrationService {

    private static final List<RegistrationStatus> ACTIVE_STATUSES = List.of(
            RegistrationStatus.PENDING_CONFIRMATION,
            RegistrationStatus.WAITING_PAYMENT,
            RegistrationStatus.PAID,
            RegistrationStatus.ENROLLED,
            RegistrationStatus.CANCELLATION_REQUESTED
    );

    private static final Set<RegistrationStatus> STAFF_PROCESS_STATUSES = EnumSet.of(
            RegistrationStatus.WAITING_PAYMENT,
            RegistrationStatus.REJECTED
    );

    private final RegistrationRepository registrationRepository;
    private final RegistrationAvailabilityRepository availabilityRepository;
    private final UserRepository userRepository;
    private final ClassroomRepository classroomRepository;
    private final CardRepository cardRepository;
    private final PaymentRepository paymentRepository;
    private final ClassroomService classroomService;

    @Transactional
    public RegistrationResponse create(CreateRegistrationRequest request) {
        validateCreateRequest(request);

        User member = userRepository.findById(request.getUserId())
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy học viên có id: " + request.getUserId()
                ));
        if (member.getRole() != Role.MEMBER || member.isDisabled()) {
            throw new IllegalArgumentException(
                    "Tài khoản đăng ký phải là học viên đang hoạt động."
            );
        }

        Classroom classroom = findRecruitingClassroom(request.getClassroomId());
        if (registrationRepository.existsByUserIdAndClassroomIdAndStatusIn(
                member.getId(), classroom.getId(), ACTIVE_STATUSES)) {
            throw new IllegalArgumentException(
                    "Bạn đã có một đăng ký đang được xử lý cho lớp này."
            );
        }

        Registration registration = Registration.builder()
                .user(member)
                .classroom(classroom)
                .status(RegistrationStatus.PENDING_CONFIRMATION)
                .memberNote(trimToNull(request.getNote()))
                .registrationDate(LocalDate.now())
                .build();

        Registration saved = registrationRepository.save(registration);
        List<RegistrationAvailability> availabilities = request.getAvailabilities()
                .stream()
                .map(item -> RegistrationAvailability.builder()
                        .registration(saved)
                        .dayOfWeek(item.getDayOfWeek())
                        .startTime(item.getStartTime())
                        .endTime(item.getEndTime())
                        .build())
                .toList();
        availabilityRepository.saveAll(availabilities);
        return toResponse(saved);
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getByMember(Long userId) {
        if (!userRepository.existsById(userId)) {
            throw new ResourceNotFoundException(
                    "Không tìm thấy học viên có id: " + userId
            );
        }
        return registrationRepository.findByUserIdOrderByRegistrationDateDescIdDesc(userId)
                .stream()
                .filter(registration -> registration.getStatus() != RegistrationStatus.CANCELLED)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RegistrationResponse cancel(Long id, Long userId) {
        Registration registration = findRegistration(id);
        if (!registration.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException(
                    "Bạn không thể hủy đăng ký của người khác."
            );
        }
        if (registration.getStatus() != RegistrationStatus.PENDING_CONFIRMATION) {
            throw new IllegalArgumentException(
                    "Chỉ đăng ký đang chờ xác nhận mới có thể hủy."
            );
        }
        registration.setStatus(RegistrationStatus.CANCELLED);
        return toResponse(registrationRepository.save(registration));
    }

    @Transactional
    public RegistrationResponse requestClassCancellation(Long cardId, Long userId) {
        if (cardId == null || userId == null) {
            throw new IllegalArgumentException("Thiếu thông tin thẻ học hoặc học viên.");
        }

        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thẻ học có id: " + cardId
                ));
        Registration registration = card.getRegistration();

        if (!registration.getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Bạn không thể gửi yêu cầu hủy lớp của người khác.");
        }
        if (registration.getStatus() == RegistrationStatus.CANCELLATION_REQUESTED) {
            throw new IllegalArgumentException("Yêu cầu hủy lớp này đang chờ nhân viên xử lý.");
        }
        if (registration.getStatus() != RegistrationStatus.ENROLLED) {
            throw new IllegalArgumentException("Chỉ lớp đang học mới có thể gửi yêu cầu hủy.");
        }
        if (!"ACTIVE".equals(card.getStatus()) && !"FROZEN".equals(card.getStatus())) {
            throw new IllegalArgumentException("Thẻ học này không ở trạng thái có thể hủy.");
        }

        RefundInfo refundInfo = calculateRefundInfo(card, findPayment(registration));
        registration.setStatus(RegistrationStatus.CANCELLATION_REQUESTED);
        registration.setMemberNote(appendNote(
                registration.getMemberNote(),
                "Yêu cầu hủy lớp. " + refundInfo.getMessage()
        ));
        return toResponse(registrationRepository.save(registration));
    }

    @Transactional(readOnly = true)
    public List<RegistrationResponse> getAllForStaff(RegistrationStatus status) {
        return registrationRepository.findAllByOrderByRegistrationDateDescIdDesc()
                .stream()
                .filter(item -> status == null || item.getStatus() == status)
                .filter(item -> item.getStatus() != RegistrationStatus.CANCELLED)
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public RegistrationResponse process(Long id, ProcessRegistrationRequest request) {
        if (request == null || request.getStatus() == null) {
            throw new IllegalArgumentException(
                    "Trạng thái xử lý không được để trống."
            );
        }
        if (!STAFF_PROCESS_STATUSES.contains(request.getStatus())) {
            throw new IllegalArgumentException(
                    "Nhân viên chỉ có thể đánh dấu đã liên hệ, chờ học phí hoặc từ chối."
            );
        }

        Registration registration = findRegistration(id);
        if (registration.getStatus() == RegistrationStatus.CANCELLED
                || registration.getStatus() == RegistrationStatus.REJECTED
                || registration.getStatus() == RegistrationStatus.ENROLLED) {
            throw new IllegalArgumentException(
                    "Đăng ký này không còn có thể xử lý."
            );
        }

        if (request.getClassroomId() != null
                && !request.getClassroomId().equals(registration.getClassroom().getId())) {
            registration.setClassroom(findRecruitingClassroom(request.getClassroomId()));
        }

        registration.setStatus(request.getStatus());
        registration.setStaffNote(trimToNull(request.getStaffNote()));
        registration.setContactedAt(LocalDateTime.now());
        return toResponse(registrationRepository.save(registration));
    }

    @Transactional
    public RegistrationResponse confirmClassCancellation(Long id, Long staffId) {
        Registration registration = findRegistration(id);
        if (registration.getStatus() != RegistrationStatus.CANCELLATION_REQUESTED) {
            throw new IllegalArgumentException("Chỉ yêu cầu hủy lớp đang chờ xử lý mới có thể xác nhận.");
        }

        User staff = userRepository.findById(staffId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy nhân viên có id: " + staffId
                ));
        if (staff.isDisabled() || (staff.getRole() != Role.STAFF && staff.getRole() != Role.ADMIN)) {
            throw new IllegalArgumentException("Người xác nhận phải là nhân viên hoặc quản trị viên đang hoạt động.");
        }

        Card card = cardRepository.findByRegistration(registration)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thẻ học của đăng ký này."
                ));
        Payment payment = findPayment(registration);
        RefundInfo refundInfo = calculateRefundInfo(card, payment);

        registration.setStatus(RegistrationStatus.CANCELLED);
        registration.setStaffNote(appendNote(
                registration.getStaffNote(),
                "Đã gọi xác nhận hủy lớp. " + refundInfo.getMessage()
        ));
        registration.setContactedAt(LocalDateTime.now());
        card.setStatus("CANCELLED");
        Classroom currentClassroom = card.getCurrentClassroom() != null
                ? card.getCurrentClassroom()
                : registration.getClassroom();
        currentClassroom.setCurrentCapacity(Math.max(0, currentClassroom.getCurrentCapacity() - 1));
        payment.setStatus(refundInfo.getRefundAmount().compareTo(BigDecimal.ZERO) > 0
                ? PaymentStatus.REFUNDED
                : PaymentStatus.CANCELLED);
        payment.setPaymentDate(LocalDateTime.now());
        payment.setCollectedBy(staff);

        cardRepository.save(card);
        classroomRepository.save(currentClassroom);
        paymentRepository.save(payment);
        return toResponse(registrationRepository.save(registration));
    }

    private RegistrationResponse toResponse(Registration registration) {
        Card card = cardRepository.findByRegistration(registration).orElse(null);
        Classroom classroom = card != null && card.getCurrentClassroom() != null
                ? card.getCurrentClassroom()
                : registration.getClassroom();
        User member = registration.getUser();
        Payment payment = paymentRepository.findByRegistration(registration).orElse(null);
        RefundInfo refundInfo = card == null ? null : calculateRefundInfo(card, payment);
        List<AvailabilityResponse> availabilities =
                availabilityRepository.findByRegistrationId(registration.getId())
                        .stream()
                        .sorted(Comparator
                                .comparingInt((RegistrationAvailability item) ->
                                        item.getDayOfWeek().getValue())
                                .thenComparing(RegistrationAvailability::getStartTime))
                        .map(item -> AvailabilityResponse.builder()
                                .dayOfWeek(item.getDayOfWeek())
                                .startTime(item.getStartTime())
                                .endTime(item.getEndTime())
                                .build())
                        .toList();

        return RegistrationResponse.builder()
                .id(registration.getId())
                .status(registration.getStatus())
                .registrationDate(registration.getRegistrationDate())
                .contactedAt(registration.getContactedAt())
                .memberNote(registration.getMemberNote())
                .staffNote(registration.getStaffNote())
                .userId(member.getId())
                .studentName(member.getName())
                .studentEmail(member.getEmail())
                .studentPhone(member.getPhoneNumber())
                .classroomId(classroom.getId())
                .classroomCode(classroom.getCode())
                .classroomName(classroom.getName())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .trainerName(classroom.getTrainer().getName())
                .availabilities(availabilities)
                .cardId(card == null ? null : card.getId())
                .session(card == null ? null : card.getSession())
                .remainingSession(card == null ? null : card.getRemainingSession())
                .cardStatus(card == null ? null : card.getStatus())
                .paidAmount(payment == null ? null : payment.getPaidAmount())
                .refundPercent(refundInfo == null ? null : refundInfo.getRefundPercent())
                .refundAmount(refundInfo == null ? null : refundInfo.getRefundAmount())
                .refundPolicyMessage(refundInfo == null ? null : refundInfo.getMessage())
                .build();
    }

    private Payment findPayment(Registration registration) {
        return paymentRepository.findByRegistration(registration)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy thanh toán của đăng ký này."
                ));
    }

    public RefundInfo calculateRefundInfo(Card card, Payment payment) {
        int totalSession = Math.max(card.getSession(), 0);
        int remainingSession = Math.max(card.getRemainingSession(), 0);
        int usedSession = Math.max(totalSession - remainingSession, 0);
        BigDecimal refundPercent;

        if (totalSession == 0 || usedSession == 0) {
            refundPercent = BigDecimal.valueOf(100);
        } else if (usedSession * 2 <= totalSession) {
            refundPercent = BigDecimal.valueOf(50);
        } else {
            refundPercent = BigDecimal.ZERO;
        }

        BigDecimal paidAmount = payment == null ? BigDecimal.ZERO : payment.getPaidAmount();
        BigDecimal refundAmount = paidAmount
                .multiply(refundPercent)
                .divide(BigDecimal.valueOf(100), 2, RoundingMode.HALF_UP);

        String message = "Đã học " + usedSession + "/" + totalSession
                + " buổi, hoàn " + refundPercent.stripTrailingZeros().toPlainString()
                + "% học phí.";

        return RefundInfo.builder()
                .refundPercent(refundPercent)
                .refundAmount(refundAmount)
                .message(message)
                .build();
    }

    private Classroom findRecruitingClassroom(Long id) {
        Classroom classroom = classroomRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy lớp học có id: " + id
                ));
        LocalDate today = LocalDate.now();
        if (classroomService.resolveStatus(classroom) != ClassroomStatus.RECRUITING) {
            throw new IllegalArgumentException("Lớp học hiện không chiêu sinh.");
        }
        if (classroom.getRecruitmentStartDate() != null
                && today.isBefore(classroom.getRecruitmentStartDate())) {
            throw new IllegalArgumentException(
                    "Lớp học chưa đến thời gian chiêu sinh."
            );
        }
        if (classroom.getRecruitmentEndDate() != null
                && today.isAfter(classroom.getRecruitmentEndDate())) {
            throw new IllegalArgumentException(
                    "Lớp học đã hết thời gian chiêu sinh."
            );
        }
        if (classroom.getCurrentCapacity() >= classroom.getMaxCapacity()) {
            throw new IllegalArgumentException("Lớp học đã đủ sĩ số.");
        }
        return classroom;
    }

    private Registration findRegistration(Long id) {
        return registrationRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Không tìm thấy đăng ký có id: " + id
                ));
    }

    private void validateCreateRequest(CreateRegistrationRequest request) {
        if (request == null
                || request.getUserId() == null
                || request.getClassroomId() == null) {
            throw new IllegalArgumentException(
                    "Học viên và lớp học là bắt buộc."
            );
        }
        if (request.getAvailabilities() == null
                || request.getAvailabilities().isEmpty()) {
            throw new IllegalArgumentException(
                    "Vui lòng chọn ít nhất một buổi có thể theo học."
            );
        }

        Set<DayOfWeek> usedDays = EnumSet.noneOf(DayOfWeek.class);
        for (AvailabilityRequest item : request.getAvailabilities()) {
            if (item == null
                    || item.getDayOfWeek() == null
                    || item.getStartTime() == null
                    || item.getEndTime() == null) {
                throw new IllegalArgumentException(
                        "Danh sách buổi học không hợp lệ."
                );
            }
            if (!item.getStartTime().isBefore(item.getEndTime())) {
                throw new IllegalArgumentException(
                        "Giờ bắt đầu phải trước giờ kết thúc."
                );
            }
            if (!usedDays.add(item.getDayOfWeek())) {
                throw new IllegalArgumentException(
                        "Mỗi thứ chỉ được khai báo một khoảng thời gian."
                );
            }
        }
    }

    private String trimToNull(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String appendNote(String currentNote, String nextNote) {
        if (currentNote == null || currentNote.isBlank()) {
            return nextNote;
        }
        return currentNote + "\n" + nextNote;
    }
}
