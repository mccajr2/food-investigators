package com.yourorg.quickapp.sessions;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;

/**
 * V11 must drop the old familiarity CHECK before renaming {@code likes} → {@code safe}.
 * An empty database masks that bug (UPDATE touches zero rows); this probe reproduces
 * the local-data failure mode.
 */
@SpringBootTest
@Import(PostgresTestcontainersConfiguration.class)
class FamiliarityMigrationOrderIntegrationTest {

    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    void updatingToSafeWhileOldCheckRemainsFails() {
        jdbcTemplate.execute(
                """
                CREATE TABLE familiarity_order_probe_fail (
                  familiarity VARCHAR(32) NOT NULL,
                  CONSTRAINT familiarity_order_probe_fail_check CHECK (
                    familiarity IN ('likes', 'familiar_but_new', 'truly_new')
                  )
                )
                """);
        jdbcTemplate.update(
                "INSERT INTO familiarity_order_probe_fail (familiarity) VALUES ('likes')");

        assertThatThrownBy(
                        () ->
                                jdbcTemplate.update(
                                        """
                                        UPDATE familiarity_order_probe_fail
                                        SET familiarity = 'safe'
                                        WHERE familiarity = 'likes'
                                        """))
                .hasMessageContaining("familiarity_order_probe_fail_check");
    }

    @Test
    void dropCheckThenRenameLikesToSafeSucceeds() {
        jdbcTemplate.execute(
                """
                CREATE TABLE familiarity_order_probe_ok (
                  familiarity VARCHAR(32) NOT NULL,
                  CONSTRAINT familiarity_order_probe_ok_check CHECK (
                    familiarity IN ('likes', 'familiar_but_new', 'truly_new')
                  )
                )
                """);
        jdbcTemplate.update(
                "INSERT INTO familiarity_order_probe_ok (familiarity) VALUES ('likes')");

        jdbcTemplate.execute(
                "ALTER TABLE familiarity_order_probe_ok DROP CONSTRAINT familiarity_order_probe_ok_check");
        jdbcTemplate.update(
                """
                UPDATE familiarity_order_probe_ok
                SET familiarity = 'safe'
                WHERE familiarity = 'likes'
                """);
        jdbcTemplate.execute(
                """
                ALTER TABLE familiarity_order_probe_ok
                  ADD CONSTRAINT familiarity_order_probe_ok_check CHECK (
                    familiarity IN ('safe', 'familiar_but_new', 'truly_new', 'retrying')
                  )
                """);

        assertThat(
                        jdbcTemplate.queryForObject(
                                "SELECT familiarity FROM familiarity_order_probe_ok", String.class))
                .isEqualTo("safe");

        jdbcTemplate.update(
                "INSERT INTO familiarity_order_probe_ok (familiarity) VALUES ('retrying')");
        assertThat(
                        jdbcTemplate.queryForObject(
                                "SELECT count(*) FROM familiarity_order_probe_ok WHERE familiarity = 'retrying'",
                                Integer.class))
                .isEqualTo(1);
    }
}
