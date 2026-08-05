# Build context is the git repo root (Gradle multi-project).
# Multi-stage: JDK 25 compile → JRE 25 run.

FROM eclipse-temurin:25-jdk-jammy AS build
WORKDIR /workspace

COPY gradlew settings.gradle.kts build.gradle.kts ./
COPY gradle ./gradle
COPY build-logic ./build-logic
COPY backend ./backend

RUN chmod +x gradlew \
  && ./gradlew :backend:bootJar --no-daemon -x test

FROM eclipse-temurin:25-jre-jammy
WORKDIR /app

RUN groupadd --system app && useradd --system --gid app app
COPY --from=build /workspace/backend/build/libs/app.jar /app/app.jar
USER app

ENV PORT=8080
EXPOSE 8080

ENTRYPOINT ["java", "-jar", "/app/app.jar"]
