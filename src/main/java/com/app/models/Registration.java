package com.app.models;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.List;

@Entity
@Table(name = "registrations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Registration {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne(optional = false)
    @JoinColumn(name = "student_id", nullable = false)
    private User user;

    @ManyToOne(optional = false)
    @JoinColumn(name = "classroom_id", nullable = false)
    private Classroom classroom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private RegistrationStatus status;

    @Column(columnDefinition = "TEXT")
    private String memberNote;

    @Column(columnDefinition = "TEXT")
    private String staffNote;

    private LocalDate registrationDate;

    private LocalDateTime contactedAt;

    @OneToMany(mappedBy = "registration", cascade = CascadeType.ALL, orphanRemoval = true)
    @Builder.Default
    private List<RegistrationAvailability> availabilities = new ArrayList<>();

    @PrePersist
    protected void createOn() {
        if (registrationDate == null) {
            registrationDate = LocalDate.now();
        }
        if (status == null) {
            status = RegistrationStatus.PENDING_CONFIRMATION;
        }
    }
}
