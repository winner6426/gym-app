package com.app.service;

import com.app.dto.classroom.ClassroomResponse;
import com.app.dto.freeze.FreezeRequestCreateRequest;
import com.app.dto.freeze.FreezeRequestResponse;
import com.app.dto.freeze.ProcessFreezeRequest;
import com.app.dto.freeze.ResumeCourseRequest;
import com.app.exception.ResourceNotFoundException;
import com.app.models.Card;
import com.app.models.Classroom;
import com.app.models.ClassroomStatus;
import com.app.models.FreezeRequest;
import com.app.models.Registration;
import com.app.repository.CardRepository;
import com.app.repository.ClassroomRepository;
import com.app.repository.FreezeRequestRepository;
import com.app.repository.RegistrationRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.Comparator;
import java.util.List;

@Service
@RequiredArgsConstructor
public class FreezeRequestService {

    private static final String ACTIVE = "ACTIVE";
    private static final String PENDING = "PENDING";
    private static final String FROZEN = "FROZEN";
    private static final String REJECTED = "REJECTED";
    private static final String RESUME_PENDING = "RESUME_PENDING";
    private static final String RESUMED = "RESUMED";

    private final FreezeRequestRepository freezeRequestRepository;
    private final CardRepository cardRepository;
    private final ClassroomRepository classroomRepository;
    private final RegistrationRepository registrationRepository;
    private final ClassroomService classroomService;

    @Transactional(readOnly = true)
    public List<FreezeRequestResponse> getMyFreezeRequests(Long userId, String status) {
        if (userId == null) {
            throw new IllegalArgumentException("Thieu thong tin hoc vien.");
        }

        List<FreezeRequest> requests = status == null || status.isBlank()
                ? freezeRequestRepository.findByRegistrationUserIdOrderByStartDateDescIdDesc(userId)
                : freezeRequestRepository.findByRegistrationUserIdAndStatusOrderByStartDateDescIdDesc(
                        userId,
                        status.trim().toUpperCase()
                );

        return requests.stream().map(this::toResponse).toList();
    }

    @Transactional(readOnly = true)
    public List<FreezeRequestResponse> getAllFreezeRequests(String status) {
        String normalizedStatus = status == null ? "" : status.trim().toUpperCase();
        return freezeRequestRepository.findAll().stream()
                .filter(request -> normalizedStatus.isBlank()
                        || normalizedStatus.equalsIgnoreCase(request.getStatus()))
                .sorted(Comparator
                        .comparing(FreezeRequest::getStartDate, Comparator.nullsLast(Comparator.reverseOrder()))
                        .thenComparing(FreezeRequest::getId, Comparator.reverseOrder()))
                .map(this::toResponse)
                .toList();
    }

    @Transactional
    public FreezeRequestResponse create(FreezeRequestCreateRequest request) {
        validateCreateRequest(request);

        Card card = getOwnedCard(request.getCardId(), request.getUserId());
        if (!ACTIVE.equalsIgnoreCase(card.getStatus())) {
            throw new IllegalArgumentException("Chi the dang hoat dong moi co the bao luu.");
        }
        if (card.getRemainingSession() <= 0) {
            throw new IllegalArgumentException("The da het buoi tap, khong the bao luu.");
        }

        boolean hasOpenFreeze = freezeRequestRepository
                .findByRegistration(card.getRegistration())
                .stream()
                .anyMatch(item -> PENDING.equalsIgnoreCase(item.getStatus())
                        || FROZEN.equalsIgnoreCase(item.getStatus())
                        || RESUME_PENDING.equalsIgnoreCase(item.getStatus()));
        if (hasOpenFreeze) {
            throw new IllegalArgumentException("Khoa hoc nay dang co yeu cau bao luu chua xu ly hoac chua hoc lai.");
        }

        FreezeRequest freezeRequest = FreezeRequest.builder()
                .registration(card.getRegistration())
                .startDate(request.getStartDate())
                .endDate(request.getEndDate())
                .reason(cleanText(request.getReason()))
                .status(PENDING)
                .build();

        return toResponse(freezeRequestRepository.save(freezeRequest));
    }

    @Transactional
    public FreezeRequestResponse process(Long freezeRequestId, ProcessFreezeRequest request) {
        if (request == null || request.getStaffId() == null) {
            throw new IllegalArgumentException("Thieu thong tin nhan vien xu ly.");
        }

        String nextStatus = cleanText(request.getStatus()).toUpperCase();
        FreezeRequest freezeRequest = freezeRequestRepository.findById(freezeRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Khong tim thay yeu cau bao luu co id: " + freezeRequestId
                ));

        if (PENDING.equalsIgnoreCase(freezeRequest.getStatus())) {
            return processFreezeApproval(freezeRequest, nextStatus, request);
        }
        if (RESUME_PENDING.equalsIgnoreCase(freezeRequest.getStatus())) {
            return processResumeApproval(freezeRequest, nextStatus, request);
        }

        throw new IllegalArgumentException("Chi yeu cau dang cho duyet moi duoc xu ly.");
    }

    private FreezeRequestResponse processFreezeApproval(
            FreezeRequest freezeRequest,
            String nextStatus,
            ProcessFreezeRequest request) {
        if (!FROZEN.equals(nextStatus) && !REJECTED.equals(nextStatus)) {
            throw new IllegalArgumentException("Trang thai xu ly bao luu khong hop le.");
        }

        Card card = cardRepository.findByRegistration(freezeRequest.getRegistration())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay the cua khoa bao luu."));
        if (FROZEN.equals(nextStatus)) {
            if (!ACTIVE.equalsIgnoreCase(card.getStatus())) {
                throw new IllegalArgumentException("The hoc vien khong con o trang thai hoat dong.");
            }
            card.setStatus(FROZEN);
            cardRepository.save(card);
        }

        freezeRequest.setStatus(nextStatus);
        freezeRequest.setStaffNote(cleanText(request.getStaffNote()));
        freezeRequest.setProcessedAt(LocalDateTime.now());
        return toResponse(freezeRequestRepository.save(freezeRequest));
    }

    private FreezeRequestResponse processResumeApproval(
            FreezeRequest freezeRequest,
            String nextStatus,
            ProcessFreezeRequest request) {
        if (!RESUMED.equals(nextStatus) && !FROZEN.equals(nextStatus)) {
            throw new IllegalArgumentException("Trang thai xu ly hoc lai khong hop le.");
        }

        Card card = cardRepository.findByRegistration(freezeRequest.getRegistration())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay the cua khoa bao luu."));
        if (!FROZEN.equalsIgnoreCase(card.getStatus())) {
            throw new IllegalArgumentException("The hoc vien khong o trang thai bao luu.");
        }

        if (RESUMED.equals(nextStatus)) {
            if (freezeRequest.getTargetClassroom() != null) {
                moveRegistrationToClassroom(
                        freezeRequest.getRegistration(),
                        freezeRequest.getTargetClassroom().getId()
                );
            }
            card.setStatus(ACTIVE);
            freezeRequest.setStatus(RESUMED);
            registrationRepository.save(freezeRequest.getRegistration());
            cardRepository.save(card);
        } else {
            freezeRequest.setStatus(FROZEN);
        }

        freezeRequest.setStaffNote(cleanText(request.getStaffNote()));
        freezeRequest.setProcessedAt(LocalDateTime.now());
        return toResponse(freezeRequestRepository.save(freezeRequest));
    }

    @Transactional(readOnly = true)
    public List<ClassroomResponse> getResumeOptions(Long userId, Long freezeRequestId, String province) {
        FreezeRequest freezeRequest = getOwnedFreezeRequest(userId, freezeRequestId);
        Card card = cardRepository.findByRegistration(freezeRequest.getRegistration())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay the cua khoa bao luu."));
        if (!FROZEN.equalsIgnoreCase(card.getStatus()) || !FROZEN.equalsIgnoreCase(freezeRequest.getStatus())) {
            return List.of();
        }

        Classroom currentClassroom = freezeRequest.getRegistration().getClassroom();
        String provinceFilter = province == null ? "" : province.trim();

        return classroomRepository.findAll().stream()
                .filter(classroom -> {
                    ClassroomStatus status = classroomService.resolveStatus(classroom);
                    return status == ClassroomStatus.RECRUITING || status == ClassroomStatus.IN_PROGRESS;
                })
                .filter(classroom -> !classroom.getId().equals(currentClassroom.getId()))
                .filter(classroom -> classroom.getCourse().getLevel() == currentClassroom.getCourse().getLevel())
                .filter(classroom -> classroom.getCurrentCapacity() < classroom.getMaxCapacity())
                .filter(classroom -> provinceFilter.isBlank()
                        || classroom.getCenter().getProvince().equalsIgnoreCase(provinceFilter))
                .sorted(Comparator
                        .comparing((Classroom classroom) -> classroom.getCenter().getProvince())
                        .thenComparing(classroom -> classroom.getCenter().getName())
                        .thenComparing(Classroom::getStartDate, Comparator.nullsLast(Comparator.naturalOrder())))
                .map(classroomService::toResponse)
                .toList();
    }

    @Transactional
    public FreezeRequestResponse resume(Long freezeRequestId, ResumeCourseRequest request) {
        if (request == null || request.getUserId() == null) {
            throw new IllegalArgumentException("Thieu thong tin hoc vien.");
        }
        if (request.getResumeDate() == null) {
            throw new IllegalArgumentException("Ngay hoc lai khong duoc de trong.");
        }

        FreezeRequest freezeRequest = getOwnedFreezeRequest(request.getUserId(), freezeRequestId);
        if (!FROZEN.equalsIgnoreCase(freezeRequest.getStatus())) {
            throw new IllegalArgumentException("Yeu cau bao luu nay khong o trang thai co the gui hoc lai.");
        }
        if (request.getResumeDate().isAfter(freezeRequest.getEndDate())) {
            throw new IllegalArgumentException("Ngay hoc lai khong duoc sau han bao luu.");
        }

        Card card = cardRepository.findByRegistration(freezeRequest.getRegistration())
                .orElseThrow(() -> new IllegalArgumentException("Khong tim thay the cua khoa bao luu."));
        if (!FROZEN.equalsIgnoreCase(card.getStatus())) {
            throw new IllegalArgumentException("The hoc vien khong o trang thai bao luu.");
        }

        Classroom targetClassroom = null;
        if (request.getTargetClassroomId() != null) {
            targetClassroom = validateResumeClassroom(
                    freezeRequest.getRegistration(),
                    request.getTargetClassroomId()
            );
        }

        freezeRequest.setTargetClassroom(targetClassroom);
        freezeRequest.setResumeDate(request.getResumeDate());
        freezeRequest.setResumeRequestedAt(LocalDateTime.now());
        freezeRequest.setStatus(RESUME_PENDING);
        return toResponse(freezeRequestRepository.save(freezeRequest));
    }

    private Classroom validateResumeClassroom(Registration registration, Long targetClassroomId) {
        Classroom currentClassroom = registration.getClassroom();
        Classroom targetClassroom = classroomRepository.findById(targetClassroomId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay lop hoc co id: " + targetClassroomId));

        if (targetClassroom.getCourse().getLevel() != currentClassroom.getCourse().getLevel()) {
            throw new IllegalArgumentException("Lop hoc lai phai cung trinh do voi khoa da bao luu.");
        }
        if (targetClassroom.getCurrentCapacity() >= targetClassroom.getMaxCapacity()) {
            throw new IllegalArgumentException("Lop hoc lai da du si so.");
        }
        ClassroomStatus targetStatus = classroomService.resolveStatus(targetClassroom);
        if (targetStatus != ClassroomStatus.RECRUITING
                && targetStatus != ClassroomStatus.IN_PROGRESS) {
            throw new IllegalArgumentException("Lop hoc lai khong con nhan hoc vien.");
        }
        return targetClassroom;
    }

    private void moveRegistrationToClassroom(Registration registration, Long targetClassroomId) {
        Classroom currentClassroom = registration.getClassroom();
        Classroom targetClassroom = validateResumeClassroom(registration, targetClassroomId);
        if (targetClassroom.getId().equals(currentClassroom.getId())) {
            return;
        }

        currentClassroom.setCurrentCapacity(Math.max(0, currentClassroom.getCurrentCapacity() - 1));
        targetClassroom.setCurrentCapacity(targetClassroom.getCurrentCapacity() + 1);
        registration.setClassroom(targetClassroom);
        classroomRepository.save(currentClassroom);
        classroomRepository.save(targetClassroom);
    }

    private Card getOwnedCard(Long cardId, Long userId) {
        Card card = cardRepository.findById(cardId)
                .orElseThrow(() -> new ResourceNotFoundException("Khong tim thay the hoc vien co id: " + cardId));
        if (!card.getRegistration().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("The hoc vien khong thuoc tai khoan hien tai.");
        }
        return card;
    }

    private FreezeRequest getOwnedFreezeRequest(Long userId, Long freezeRequestId) {
        FreezeRequest freezeRequest = freezeRequestRepository.findById(freezeRequestId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Khong tim thay yeu cau bao luu co id: " + freezeRequestId
                ));
        if (!freezeRequest.getRegistration().getUser().getId().equals(userId)) {
            throw new IllegalArgumentException("Yeu cau bao luu khong thuoc tai khoan hien tai.");
        }
        return freezeRequest;
    }

    private void validateCreateRequest(FreezeRequestCreateRequest request) {
        if (request == null || request.getUserId() == null || request.getCardId() == null) {
            throw new IllegalArgumentException("Thieu thong tin bao luu.");
        }
        if (request.getStartDate() == null || request.getEndDate() == null) {
            throw new IllegalArgumentException("Ngay bat dau va ngay quay lai khong duoc de trong.");
        }
        if (request.getStartDate().isAfter(request.getEndDate())) {
            throw new IllegalArgumentException("Ngay bat dau phai truoc ngay du kien quay lai.");
        }
        if (request.getEndDate().isAfter(request.getStartDate().plusYears(1))) {
            throw new IllegalArgumentException("Thoi gian bao luu toi da la 1 nam.");
        }
        if (request.getEndDate().isBefore(LocalDate.now())) {
            throw new IllegalArgumentException("Han bao luu khong duoc nam trong qua khu.");
        }
        if (cleanText(request.getReason()).isBlank()) {
            throw new IllegalArgumentException("Ly do bao luu khong duoc de trong.");
        }
    }

    private FreezeRequestResponse toResponse(FreezeRequest freezeRequest) {
        Registration registration = freezeRequest.getRegistration();
        Classroom classroom = registration.getClassroom();
        Classroom targetClassroom = freezeRequest.getTargetClassroom();
        Card card = cardRepository.findByRegistration(registration).orElse(null);

        return FreezeRequestResponse.builder()
                .id(freezeRequest.getId())
                .cardId(card == null ? null : card.getId())
                .registrationId(registration.getId())
                .studentId(registration.getUser().getId())
                .studentName(registration.getUser().getName())
                .studentEmail(registration.getUser().getEmail())
                .studentPhone(registration.getUser().getPhoneNumber())
                .classroomName(classroom.getName())
                .classroomCode(classroom.getCode())
                .courseName(classroom.getCourse().getName())
                .level(classroom.getCourse().getLevel())
                .centerName(classroom.getCenter().getName())
                .province(classroom.getCenter().getProvince())
                .targetClassroomId(targetClassroom == null ? null : targetClassroom.getId())
                .targetClassroomName(targetClassroom == null ? null : targetClassroom.getName())
                .targetClassroomCode(targetClassroom == null ? null : targetClassroom.getCode())
                .targetCenterName(targetClassroom == null ? null : targetClassroom.getCenter().getName())
                .targetProvince(targetClassroom == null ? null : targetClassroom.getCenter().getProvince())
                .remainingSession(card == null ? null : card.getRemainingSession())
                .startDate(freezeRequest.getStartDate())
                .endDate(freezeRequest.getEndDate())
                .resumeDate(freezeRequest.getResumeDate())
                .reason(freezeRequest.getReason())
                .staffNote(freezeRequest.getStaffNote())
                .status(freezeRequest.getStatus())
                .build();
    }

    private String cleanText(String value) {
        return value == null ? "" : value.trim();
    }
}
