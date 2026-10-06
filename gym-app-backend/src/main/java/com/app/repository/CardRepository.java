package com.app.repository;

import com.app.models.Card;
import com.app.models.Registration;
import com.app.models.RegistrationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.Optional;
import java.util.List;

public interface CardRepository extends JpaRepository<Card, Long> {
    Optional<Card> findByRegistration(Registration registration);
    Optional<Card> findByRegistrationId(Long registrationId);
    List<Card> findByRegistrationUserIdOrderByIssuedDateDescIdDesc(Long userId);

    @Query("""
            select c from Card c
            join c.registration r
            join r.user u
            where (
                (c.currentClassroom is not null and c.currentClassroom.id = :classroomId)
                or (c.currentClassroom is null and r.classroom.id = :classroomId)
            )
              and r.status in :statuses
              and upper(c.status) = 'ACTIVE'
            order by u.name asc
            """)
    List<Card> findActiveCardsByEffectiveClassroomAndRegistrationStatuses(
            @Param("classroomId") Long classroomId,
            @Param("statuses") List<RegistrationStatus> statuses
    );

    @Query("""
            select count(c) from Card c
            join c.registration r
            left join c.course course
            where (course.id = :courseId or (course is null and r.classroom.course.id = :courseId))
            """)
    long countByEffectiveCourseId(@Param("courseId") Long courseId);
}
