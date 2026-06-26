package com.app.models;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "freeze_requests")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class FreezeRequest {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private LocalDate startDate;
    private LocalDate endDate;
    private String reason;
    private String staffNote;
    private String status;
    private LocalDateTime processedAt;
    private LocalDate resumeDate;
    private LocalDateTime resumeRequestedAt;

    @ManyToOne
    @JoinColumn(name = "registration_id")
    private Registration registration;

    @ManyToOne
    @JoinColumn(name = "target_classroom_id")
    private Classroom targetClassroom;
}
