package com.yourorg.quickapp.accounts.internal;

import java.util.UUID;
import org.springframework.data.jpa.repository.JpaRepository;

interface HouseholdRepository extends JpaRepository<Household, UUID> {}
