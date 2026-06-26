package com.app.dto.card;

import com.app.models.Level;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Getter;
import lombok.NoArgsConstructor;
import lombok.Setter;

import java.math.BigDecimal;
import java.time.LocalDate;

@Getter
@Setter
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class CardResponse {
    private Long id;
    private Long registrationId;
    private Long studentId;
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
    private int session;
    private int remainingSession;
    private LocalDate issuedDate;
    private LocalDate expiredDate;
    private String status;
    private String registrationStatus;
    private BigDecimal paidAmount;
    private BigDecimal refundPercent;
    private BigDecimal refundAmount;
    private String refundPolicyMessage;
}
