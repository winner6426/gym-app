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
    private LocalDate issuedDate;
    private LocalDate expiredDate;

    private String status;

    @OneToOne
    @JoinColumn(name = "registration_id", unique = true)
    private Registration registration;

}
