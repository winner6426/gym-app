package com.app.repository;

import com.app.models.Center;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface CenterRepository extends JpaRepository<Center, Long> {
    List<Center> findByProvince(String province);

    boolean existsByName(String name);
    boolean existsByAddress(String address);
}
