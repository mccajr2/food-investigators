package com.yourorg.quickapp.sessions.internal;

import com.yourorg.quickapp.sessions.GeminiProperties;
import org.springframework.boot.context.properties.EnableConfigurationProperties;
import org.springframework.context.annotation.Configuration;

@Configuration
@EnableConfigurationProperties(GeminiProperties.class)
class SessionsModuleConfiguration {}
