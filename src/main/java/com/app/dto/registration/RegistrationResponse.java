package com.app.dto.registration;

import com.app.models.Level;
import com.app.models.RegistrationStatus;
import lombok.*;

import java.math.BigDecimal;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.List;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class RegistrationResponse {
    private Long id;
    private RegistrationStatus status;
    private LocalDate registrationDate;
    private LocalDateTime contactedAt;
    private String memberNote;
    private String staffNote;
    private Long userId;
    private String studentName;
    private String studentEmail;
    private String studentPhone;
    private Long classroomId;
    private String classroomCode;
    private String classroomName;
    private String courseName;
    private Level level;
    private String centerName;
    private String province;
    private String trainerName;
    private List<AvailabilityResponse> availabilities;
    private Long cardId;
    private Integer session;
    private Integer remainingSession;
    private String cardStatus;
    private BigDecimal paidAmount;
    private BigDecimal refundPercent;
    private BigDecimal refundAmount;
    private String refundPolicyMessage;
}
