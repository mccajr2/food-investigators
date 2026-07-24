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
import kotlin.test.assertTrue
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json

class InsightsClientTest {

    @Test
    fun getSendsBearerAndParsesInsights() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            var sawAuth: String? = null
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Get, request.method)
                    assertEquals("/api/insights", request.url.encodedPath)
                    sawAuth = request.headers[HttpHeaders.Authorization]
                    respond(
                        content = sampleInsightsJson(),
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = InsightsClient("http://localhost:8080", httpClient(engine), store)
            val insights = client.get()

            assertEquals(3, insights.completedSessionCount)
            assertTrue(insights.ready)
            assertEquals(4, insights.familiaritySafe)
            assertEquals(2, insights.tips.size)
            assertEquals("keep_going", insights.tips[1].id)
            assertEquals("Bearer tok", sawAuth)
        }

    @Test
    fun dismissTipPostsAndParsesOk() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Post, request.method)
                    assertEquals(
                        "/api/insights/tips/keep_going/dismiss",
                        request.url.encodedPath,
                    )
                    respond(
                        content = """{"status":"ok"}""",
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = InsightsClient("http://localhost:8080", httpClient(engine), store)
            val result = client.dismissTip("keep_going")

            assertEquals("ok", result.status)
        }

    @Test
    fun dismissUnknownTipSurfacesMessage() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val engine =
                MockEngine {
                    respond(
                        content = """{"message":"Unknown tip id: nope"}""",
                        status = HttpStatusCode.BadRequest,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = InsightsClient("http://localhost:8080", httpClient(engine), store)
            val error =
                assertFailsWith<InsightsException> {
                    client.dismissTip("nope")
                }
            assertEquals("Unknown tip id: nope", error.message)
        }

    private fun httpClient(engine: MockEngine): HttpClient =
        HttpClient(engine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }

    private fun sampleInsightsJson(): String =
        """
        {
          "completedSessionCount": 3,
          "ready": true,
          "ateEnoughYes": 4,
          "ateEnoughNo": 2,
          "likedLike": 5,
          "likedSoSo": 1,
          "likedNo": 0,
          "likedSkipped": 0,
          "topLikedTextures": ["crunchy", "soft"],
          "familiaritySafe": 4,
          "familiarityFamiliarButNew": 2,
          "familiarityTrulyNew": 0,
          "snackCount": 1,
          "hasParentNotes": false,
          "tips": [
            {
              "id": "mix_familiarity",
              "message": "You've stuck to known foods — when you're ready, try one gentle familiar-but-new."
            },
            {
              "id": "keep_going",
              "message": "You're building a tasting rhythm — keep going at a calm pace."
            }
          ]
        }
        """.trimIndent()
}
