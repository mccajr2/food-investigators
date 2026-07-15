package com.yourorg.quickapp.foods;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

@SpringBootTest
@Import(PostgresTestcontainersConfiguration.class)
class FoodsSeedIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void flywaySeedsTwentySystemStarterFoods() {
        Integer count =
                jdbcTemplate.queryForObject(
                        "select count(*) from foods where household_id is null and archived_at is null",
                        Integer.class);
        assertThat(count).isEqualTo(20);

        Integer invalidIcons =
                jdbcTemplate.queryForObject(
                        """
                        select count(*) from foods
                        where household_id is null
                          and icon_key not in (
                            'bagel_cream_cheese','ramen','chicken_tenders','apple','strawberry',
                            'pancakes_choc_chip','yogurt_plain','bagel','toast','chicken_nuggets',
                            'applesauce','banana','blueberry','grape','pancakes_plain','waffle',
                            'yogurt_vanilla','carrot','corn','sweet_potato'
                          )
                        """,
                        Integer.class);
        assertThat(invalidIcons).isZero();
    }
}
