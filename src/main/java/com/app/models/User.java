package com.app.models;

import com.fasterxml.jackson.annotation.JsonManagedReference;
import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.util.Set;

@Entity
@Table(name = "users")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class User {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(unique = true, nullable = false)
    private String email;

    @Column(nullable = false)
    private String password;

    @Column(name = "name")
    private String name;

    @Column(unique = true, nullable = false)
    private String phoneNumber;

    @Enumerated(EnumType.STRING)
    private Role role;

    @Builder.Default
    @Column(nullable = false)
    private boolean disabled = false;

    @Column(name = "created_date", updatable = false)
    private LocalDate createdDate;

    @Column(name = "end_date")
    private LocalDate endDate;

    @OneToMany(mappedBy = "user", fetch = FetchType.LAZY, cascade = CascadeType.ALL)
    @JsonManagedReference
    private Set<Measurement> measurements;

    @PrePersist
    protected void createOn() {
        this.createdDate = LocalDate.now();
    }

}
