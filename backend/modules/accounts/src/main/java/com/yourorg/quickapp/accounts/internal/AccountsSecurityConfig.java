package com.yourorg.quickapp.accounts.internal;

import com.yourorg.quickapp.accounts.SessionTtlProperties;
import java.time.Clock;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.config.Customizer;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;

@Configuration
@EnableWebSecurity
@EnableConfigurationProperties(SessionTtlProperties.class)
class AccountsSecurityConfig {

    @Bean
    Clock clock() {
        return Clock.systemUTC();
    }

    @Bean
    SecurityFilterChain securityFilterChain(
            HttpSecurity http, BearerTokenAuthenticationFilter bearerTokenAuthenticationFilter)
            throws Exception {
        http.csrf(AbstractHttpConfigurer::disable)
                .cors(Customizer.withDefaults())
                .httpBasic(AbstractHttpConfigurer::disable)
                .formLogin(AbstractHttpConfigurer::disable)
                .sessionManagement(
                        sessions -> sessions.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
                .authorizeHttpRequests(
                        auth ->
                                auth.requestMatchers(HttpMethod.OPTIONS, "/**")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/auth/register")
                                        .permitAll()
                                        .requestMatchers(HttpMethod.POST, "/api/auth/login")
                                        .permitAll()
                                        .anyRequest()
                                        .authenticated())
                .exceptionHandling(
                        exceptions ->
                                exceptions.authenticationEntryPoint(
                                        (request, response, authException) -> {
                                            response.setStatus(401);
                                            response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                                            response.getWriter()
                                                    .write("{\"message\":\"Unauthorized\"}");
                                        }))
                .addFilterBefore(
                        bearerTokenAuthenticationFilter,
                        UsernamePasswordAuthenticationFilter.class);
        return http.build();
    }
}
