package com.app.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;

@Entity
@Table(name = "classrooms")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Classroom {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String code;

    @Column(nullable = false)
    private String name;

    private LocalDate recruitmentStartDate;
    private LocalDate recruitmentEndDate;
    private LocalDate startDate;
    private LocalDate endDate;

    @Builder.Default
    @Column(nullable = false)
    private Integer maxCapacity = 30;

    @Builder.Default
    @Column(nullable = false)
    private Integer currentCapacity = 0;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private ClassroomStatus status = ClassroomStatus.RECRUITING;

    @ManyToOne(optional = false)
    @JoinColumn(name = "course_id", nullable = false)
    private Course course;

    @ManyToOne(optional = false)
    @JoinColumn(name = "center_id", nullable = false)
    private Center center;

    @ManyToOne(optional = false)
    @JoinColumn(name = "trainer_id", nullable = false)
    private User trainer;
}
