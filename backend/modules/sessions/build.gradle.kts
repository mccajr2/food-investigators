plugins {
    id("quickapp.module-conventions")
}

dependencies {
    implementation(project(":accounts"))
    implementation(project(":foods"))
    implementation(libs.spring.boot.starter.web)
    implementation(libs.spring.boot.starter.data.jpa)
    implementation(libs.spring.boot.starter.security)
    implementation(libs.spring.boot.starter.validation)
    implementation(libs.pdfbox)
    testRuntimeOnly("org.junit.platform:junit-platform-launcher")
}
