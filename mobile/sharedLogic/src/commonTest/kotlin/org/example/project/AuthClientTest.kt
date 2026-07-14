package org.example.project

import io.ktor.client.HttpClient
import io.ktor.client.engine.mock.MockEngine
import io.ktor.client.engine.mock.respond
import io.ktor.client.plugins.contentnegotiation.ContentNegotiation
import io.ktor.http.HttpHeaders
import io.ktor.http.HttpMethod
import io.ktor.http.HttpStatusCode
import io.ktor.http.headersOf
import io.ktor.serialization.kotlinx.json.json
import kotlin.test.Test
import kotlin.test.assertEquals
import kotlin.test.assertFailsWith
import kotlin.test.assertNull
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json

class AuthClientTest {

    @Test
    fun registerStoresRememberToken() =
        runTest {
            val store = InMemoryTokenStore()
            val client = AuthClient("http://localhost:8080", mockHttpClient(), store)

            val auth = client.register("parent@example.com", "password1", rememberMe = true)

            assertEquals("parent@example.com", auth.user.email)
            assertEquals("tok-123", store.getToken())
        }

    @Test
    fun loginSendsBearerOnMe() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("existing", rememberMe = true)
            var sawAuthHeader: String? = null
            val engine =
                MockEngine { request ->
                    if (request.url.encodedPath == "/api/auth/me") {
                        sawAuthHeader = request.headers[HttpHeaders.Authorization]
                        respond(
                            content =
                                """
                                {"id":"11111111-1111-1111-1111-111111111111",
                                 "email":"parent@example.com",
                                 "householdId":"22222222-2222-2222-2222-222222222222"}
                                """.trimIndent(),
                            status = HttpStatusCode.OK,
                            headers = headersOf(HttpHeaders.ContentType, "application/json"),
                        )
                    } else {
                        error("Unexpected ${request.url.encodedPath}")
                    }
                }

            val client = AuthClient("http://localhost:8080", httpClient(engine), store)
            val me = client.me()

            assertEquals("parent@example.com", me.email)
            assertEquals("Bearer existing", sawAuthHeader)
        }

    @Test
    fun duplicateEmailSurfacesApiMessage() =
        runTest {
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Post, request.method)
                    assertEquals("/api/auth/register", request.url.encodedPath)
                    respond(
                        content = """{"message":"Email already registered"}""",
                        status = HttpStatusCode.Conflict,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = AuthClient("http://localhost:8080", httpClient(engine), InMemoryTokenStore())

            val error =
                assertFailsWith<AuthException> {
                    client.register("parent@example.com", "password1", true)
                }
            assertEquals("Email already registered", error.message)
            assertNull(client.getStoredToken())
        }

    @Test
    fun loginAndLogoutClearStoredToken() =
        runTest {
            val store = InMemoryTokenStore()
            val engine =
                MockEngine { request ->
                    when (request.url.encodedPath) {
                        "/api/auth/login" ->
                            respond(
                                content =
                                    """
                                    {"token":"login-tok",
                                     "user":{"id":"11111111-1111-1111-1111-111111111111",
                                             "email":"parent@example.com",
                                             "householdId":"22222222-2222-2222-2222-222222222222"}}
                                    """.trimIndent(),
                                status = HttpStatusCode.OK,
                                headers = headersOf(HttpHeaders.ContentType, "application/json"),
                            )
                        "/api/auth/logout" -> {
                            assertEquals("Bearer login-tok", request.headers[HttpHeaders.Authorization])
                            respond("", status = HttpStatusCode.NoContent)
                        }
                        else -> error("Unexpected ${request.url.encodedPath}")
                    }
                }

            val client = AuthClient("http://localhost:8080", httpClient(engine), store)
            client.login("parent@example.com", "password1", rememberMe = false)
            assertEquals("login-tok", store.getToken())

            client.logout()
            assertNull(store.getToken())
        }

    private fun mockHttpClient(): HttpClient {
        val engine =
            MockEngine { request ->
                assertEquals("/api/auth/register", request.url.encodedPath)
                respond(
                    content =
                        """
                        {"token":"tok-123",
                         "user":{"id":"11111111-1111-1111-1111-111111111111",
                                 "email":"parent@example.com",
                                 "householdId":"22222222-2222-2222-2222-222222222222"}}
                        """.trimIndent(),
                    status = HttpStatusCode.Created,
                    headers = headersOf(HttpHeaders.ContentType, "application/json"),
                )
            }
        return httpClient(engine)
    }

    private fun httpClient(engine: MockEngine): HttpClient =
        HttpClient(engine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
}
