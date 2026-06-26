package com.app.models;

import lombok.*;
import jakarta.persistence.*;
import java.time.LocalDate;

@Entity
@Table(name = "cards")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Card {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private int session;
    private int remainingSession;
    private Integer classroomSessionOffset;
    private LocalDate issuedDate;
    private LocalDate expiredDate;

    private String status;

    @OneToOne
    @JoinColumn(name = "registration_id", unique = true)
    private Registration registration;

    @ManyToOne
    @JoinColumn(name = "course_id")
    private Course course;

    @ManyToOne
    @JoinColumn(name = "current_classroom_id")
    private Classroom currentClassroom;

}
