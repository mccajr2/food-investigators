package com.yourorg.quickapp.foods.internal;

import java.util.Collection;
import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

interface FoodIllustrationRepository extends JpaRepository<FoodIllustration, String> {

    List<FoodIllustration> findByCanonicalKeyIn(Collection<String> canonicalKeys);
}
