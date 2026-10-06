package com.app.repository;

import com.app.models.Classroom;
import com.app.models.Registration;
import com.app.models.User;
import com.app.models.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface RegistrationRepository extends JpaRepository<Registration, Long> {
    List<Registration> findByUser(User user);

    List<Registration> findByClassroom(Classroom classroom);

    List<Registration> findByUserIdOrderByRegistrationDateDescIdDesc(Long userId);

    boolean existsByUserId(Long userId);

    List<Registration> findAllByOrderByRegistrationDateDescIdDesc();

    boolean existsByUserIdAndClassroomIdAndStatusIn(
            Long userId,
            Long classroomId,
            List<RegistrationStatus> statuses
    );

    long countByUserIdAndStatusIn(
            Long userId,
            List<RegistrationStatus> statuses
    );

    long countByUserIdAndIdNotAndStatusIn(
            Long userId,
            Long id,
            List<RegistrationStatus> statuses
    );

    List<Registration> findByStatusInOrderByRegistrationDateAscIdAsc(
            List<RegistrationStatus> statuses
    );

    List<Registration> findByClassroomIdAndStatus(
            Long classroomId,
            RegistrationStatus status
    );
}
