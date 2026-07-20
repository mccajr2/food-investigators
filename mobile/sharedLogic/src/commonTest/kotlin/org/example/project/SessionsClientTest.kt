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
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json

class SessionsClientTest {

    @Test
    fun listUpcomingSendsBearerAndParsesSessions() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            var sawAuth: String? = null
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Get, request.method)
                    assertEquals("/api/sessions", request.url.encodedPath)
                    sawAuth = request.headers[HttpHeaders.Authorization]
                    respond(
                        content = sampleSessionJsonArray(),
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = SessionsClient("http://localhost:8080", httpClient(engine), store)
            val sessions = client.listUpcoming()

            assertEquals(1, sessions.size)
            assertEquals("2026-07-20", sessions[0].scheduledOn)
            assertEquals("planned", sessions[0].status)
            assertEquals(2, sessions[0].foods.size)
            assertEquals("Honeycrisp", sessions[0].foods[0].variantNote)
            assertEquals("Bearer tok", sawAuth)
        }

    @Test
    fun listHistorySendsBearerAndParsesCompletedSessions() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            var sawAuth: String? = null
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Get, request.method)
                    assertEquals("/api/sessions/history", request.url.encodedPath)
                    sawAuth = request.headers[HttpHeaders.Authorization]
                    respond(
                        content = "[${completedSessionJson()}]",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = SessionsClient("http://localhost:8080", httpClient(engine), store)
            val history = client.listHistory()

            assertEquals(1, history.size)
            assertEquals("completed", history[0].status)
            assertEquals("2026-07-20", history[0].scheduledOn)
            assertEquals("like", history[0].foods[0].liked)
            assertEquals("crunchy", history[0].foods[0].whyNote)
            assertEquals(false, history[0].foods[1].ateEnough)
            assertEquals("Bearer tok", sawAuth)
        }

    @Test
    fun downloadHistoryPdfSendsBearerAndOptionalDateRange() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val pdfBytes = byteArrayOf(0x25, 0x50, 0x44, 0x46)
            val paths = mutableListOf<String>()
            var sawAuth: String? = null
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Get, request.method)
                    paths +=
                        buildString {
                            append(request.url.encodedPath)
                            val query = request.url.encodedQuery
                            if (query.isNotEmpty()) {
                                append("?")
                                append(query)
                            }
                        }
                    sawAuth = request.headers[HttpHeaders.Authorization]
                    respond(
                        content = pdfBytes,
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/pdf"),
                    )
                }

            val client = SessionsClient("http://localhost:8080", httpClient(engine), store)

            val full = client.downloadHistoryPdf()
            assertEquals(pdfBytes.toList(), full.toList())

            client.downloadHistoryPdf(from = "2026-07-01", to = "2026-07-31")
            client.downloadHistoryPdf(from = "2026-07-15")

            assertEquals(
                listOf(
                    "/api/sessions/history.pdf",
                    "/api/sessions/history.pdf?from=2026-07-01&to=2026-07-31",
                    "/api/sessions/history.pdf?from=2026-07-15",
                ),
                paths,
            )
            assertEquals("Bearer tok", sawAuth)
        }

    @Test
    fun createGetUpdateCancelHitExpectedPaths() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val paths = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    paths += "${request.method.value} ${request.url.encodedPath}"
                    val status =
                        if (request.method == HttpMethod.Post &&
                            request.url.encodedPath == "/api/sessions"
                        ) {
                            HttpStatusCode.Created
                        } else {
                            HttpStatusCode.OK
                        }
                    respond(
                        content = sampleSessionJson(),
                        status = status,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = SessionsClient("http://localhost:8080", httpClient(engine), store)
            val request =
                CreateSessionRequest(
                    scheduledOn = "2026-07-20",
                    foods =
                        listOf(
                            SessionFoodRequest(
                                foodId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
                                familiarity = "likes",
                                variantNote = "Honeycrisp",
                            ),
                            SessionFoodRequest(
                                foodId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
                                familiarity = "truly_new",
                            ),
                        ),
                )
            client.create(request)
            client.get("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")
            client.update(
                "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                UpdateSessionRequest(
                    scheduledOn = "2026-07-22",
                    foods = request.foods,
                ),
            )
            client.cancel("eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee")

            assertEquals(
                listOf(
                    "POST /api/sessions",
                    "GET /api/sessions/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                    "PUT /api/sessions/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                    "POST /api/sessions/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/cancel",
                ),
                paths,
            )
        }

    @Test
    fun invalidFoodsSurfaceApiMessage() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val engine =
                MockEngine {
                    respond(
                        content =
                            """{"message":"Food is unknown, archived, or not in this household catalog"}""",
                        status = HttpStatusCode.BadRequest,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = SessionsClient("http://localhost:8080", httpClient(engine), store)
            val error =
                assertFailsWith<SessionsException> {
                    client.create(
                        CreateSessionRequest(
                            scheduledOn = "2026-07-20",
                            foods =
                                listOf(
                                    SessionFoodRequest(
                                        foodId = "ffffffff-ffff-ffff-ffff-ffffffffffff",
                                        familiarity = "likes",
                                    ),
                                    SessionFoodRequest(
                                        foodId = "aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
                                        familiarity = "likes",
                                    ),
                                ),
                        ),
                    )
                }
            assertEquals(
                "Food is unknown, archived, or not in this household catalog",
                error.message,
            )
        }

    @Test
    fun completePostsOutcomesAndParsesCompletedSession() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Post, request.method)
                    assertEquals(
                        "/api/sessions/eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee/complete",
                        request.url.encodedPath,
                    )
                    assertEquals("Bearer tok", request.headers[HttpHeaders.Authorization])
                    respond(
                        content = completedSessionJson(),
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = SessionsClient("http://localhost:8080", httpClient(engine), store)
            val completed =
                client.complete(
                    "eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
                    CompleteSessionRequest(
                        foods =
                            listOf(
                                FoodOutcomeRequest(
                                    position = 1,
                                    liked = "like",
                                    texture = "crunchy",
                                    temperature = "cold",
                                    smell = "mild",
                                    whyNote = "crunchy",
                                    changeNote = "less peel",
                                    ateEnough = true,
                                ),
                                FoodOutcomeRequest(
                                    position = 2,
                                    liked = "no",
                                    temperature = "warm",
                                    ateEnough = false,
                                ),
                            ),
                    ),
                )

            assertEquals("completed", completed.status)
            assertEquals("like", completed.foods[0].liked)
            assertEquals(true, completed.foods[0].ateEnough)
            assertEquals("no", completed.foods[1].liked)
            assertEquals(false, completed.foods[1].ateEnough)
        }

    @Test
    fun requiresSignedInToken() =
        runTest {
            val client =
                SessionsClient(
                    "http://localhost:8080",
                    httpClient(MockEngine { error("unreachable") }),
                    InMemoryTokenStore(),
                )
            val error = assertFailsWith<SessionsException> { client.listUpcoming() }
            assertEquals("Not signed in", error.message)
        }

    private fun completedSessionJson(): String =
        """
        {"id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
         "scheduledOn":"2026-07-20",
         "status":"completed",
         "foods":[
           {"foodId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
            "name":"Apples",
            "iconKey":"apple",
            "familiarity":"likes",
            "variantNote":"Honeycrisp",
            "position":1,
            "liked":"like",
            "texture":"crunchy",
            "temperature":"cold",
            "smell":"mild",
            "whyNote":"crunchy",
            "changeNote":"less peel",
            "ateEnough":true},
           {"foodId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
            "name":"Strawberries",
            "iconKey":"strawberry",
            "familiarity":"truly_new",
            "variantNote":null,
            "position":2,
            "liked":"no",
            "texture":null,
            "temperature":"warm",
            "smell":null,
            "whyNote":null,
            "changeNote":null,
            "ateEnough":false}
         ],
         "createdAt":"2026-07-15T00:00:00Z",
         "updatedAt":"2026-07-15T00:00:00Z"}
        """.trimIndent()

    private fun sampleSessionJson(): String =
        """
        {"id":"eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee",
         "scheduledOn":"2026-07-20",
         "status":"planned",
         "foods":[
           {"foodId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa04",
            "name":"Apples",
            "iconKey":"apple",
            "familiarity":"likes",
            "variantNote":"Honeycrisp",
            "position":1},
           {"foodId":"aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaa05",
            "name":"Strawberries",
            "iconKey":"strawberry",
            "familiarity":"truly_new",
            "variantNote":null,
            "position":2}
         ],
         "createdAt":"2026-07-15T00:00:00Z",
         "updatedAt":"2026-07-15T00:00:00Z"}
        """.trimIndent()

    private fun sampleSessionJsonArray(): String = "[${sampleSessionJson()}]"

    private fun httpClient(engine: MockEngine): HttpClient =
        HttpClient(engine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
}
