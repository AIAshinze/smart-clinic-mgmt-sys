package com.project.back_end.repo;

import java.util.Optional;

import org.springframework.data.jpa.repository.JpaRepository;

import com.project.back_end.models.Admin;

public interface AdminRepository extends JpaRepository<Admin, Long> {

    Optional<Admin> findByUsernameIgnoreCase(String username);
}
