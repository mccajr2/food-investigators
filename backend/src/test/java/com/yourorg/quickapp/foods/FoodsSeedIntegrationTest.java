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
    void flywaySeedsTwentySixSystemStarterFoods() {
        Integer count =
                jdbcTemplate.queryForObject(
                        "select count(*) from foods where household_id is null and archived_at is null",
                        Integer.class);
        assertThat(count).isEqualTo(26);

        Integer invalidIcons =
                jdbcTemplate.queryForObject(
                        """
                        select count(*) from foods
                        where household_id is null
                          and icon_key not in (
                            'bagel_cream_cheese','ramen','chicken_tenders','apple','strawberry',
                            'pancakes_choc_chip','yogurt_plain','bagel','toast','chicken_nuggets',
                            'applesauce','banana','blueberry','grape','pancakes_plain','waffle',
                            'yogurt_vanilla','carrot','corn','sweet_potato',
                            'cheese_pizza','soft_pretzel','raspberry',
                            'broccoli','dark_chocolate','spinach'
                          )
                        """,
                        Integer.class);
        assertThat(invalidIcons).isZero();

        Integer bitterExampleStarters =
                jdbcTemplate.queryForObject(
                        """
                        select count(*) from foods
                        where household_id is null
                          and id in (
                            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa24',
                            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa25',
                            'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa26'
                          )
                          and (
                            (name = 'Broccoli' and icon_key = 'broccoli')
                            or (name = 'Dark chocolate' and icon_key = 'dark_chocolate')
                            or (name = 'Spinach' and icon_key = 'spinach')
                          )
                        """,
                        Integer.class);
        assertThat(bitterExampleStarters).isEqualTo(3);
    }
}
