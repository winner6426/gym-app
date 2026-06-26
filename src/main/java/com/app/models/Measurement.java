package com.app.models;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "measurements")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Measurement {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @ManyToOne
    @JoinColumn(name = "user_id")
    private User user;

    private double height;
    private double weight;
    private double chest;
    private double waist;
    private double hip;
    private double bodyFat;

}
