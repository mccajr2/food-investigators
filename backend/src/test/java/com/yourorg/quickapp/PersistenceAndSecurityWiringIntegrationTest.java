package com.yourorg.quickapp;

import static org.assertj.core.api.Assertions.assertThat;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import javax.sql.DataSource;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.context.annotation.Import;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;

@SpringBootTest
@Import(PostgresTestcontainersConfiguration.class)
class PersistenceAndSecurityWiringIntegrationTest {

    @Autowired
    private DataSource dataSource;

    @Autowired
    private PasswordEncoder passwordEncoder;

    @Autowired
    private SecurityFilterChain securityFilterChain;

    @Test
    void flywayAppliedBootstrapMigration() {
        JdbcTemplate jdbc = new JdbcTemplate(dataSource);
        Integer applied =
                jdbc.queryForObject(
                        "select count(*) from flyway_schema_history where success = true",
                        Integer.class);
        assertThat(applied).isNotNull().isGreaterThanOrEqualTo(1);
    }

    @Test
    void passwordEncoderAndSecurityFilterChainAreAvailable() {
        assertThat(passwordEncoder).isNotNull();
        assertThat(passwordEncoder.encode("secret")).startsWith("$2");
        assertThat(securityFilterChain).isNotNull();
    }
}
