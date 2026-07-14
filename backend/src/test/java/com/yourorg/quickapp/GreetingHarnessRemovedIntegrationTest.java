package com.yourorg.quickapp;

import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

import com.yourorg.quickapp.support.PostgresTestcontainersConfiguration;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.webmvc.test.autoconfigure.AutoConfigureMockMvc;
import org.springframework.context.annotation.Import;
import org.springframework.test.web.servlet.MockMvc;

@SpringBootTest
@AutoConfigureMockMvc
@Import(PostgresTestcontainersConfiguration.class)
class GreetingHarnessRemovedIntegrationTest {

    @Autowired
    private MockMvc mockMvc;

    @Test
    void greetingEndpointIsNoLongerPublic() throws Exception {
        mockMvc.perform(get("/api/greeting").param("name", "Android"))
                .andExpect(status().isUnauthorized());
    }
}
