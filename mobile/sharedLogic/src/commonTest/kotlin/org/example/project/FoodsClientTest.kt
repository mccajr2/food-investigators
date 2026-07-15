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
import kotlin.test.assertFalse
import kotlinx.coroutines.test.runTest
import kotlinx.serialization.json.Json

class FoodsClientTest {

    @Test
    fun listSendsBearerAndParsesFoods() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            var sawAuth: String? = null
            val engine =
                MockEngine { request ->
                    assertEquals(HttpMethod.Get, request.method)
                    assertEquals("/api/foods", request.url.encodedPath)
                    sawAuth = request.headers[HttpHeaders.Authorization]
                    respond(
                        content =
                            """
                            [{"id":"cccccccc-cccc-cccc-cccc-cccccccccccc",
                              "name":"Extra apple mash",
                              "iconKey":"apple",
                              "householdId":"22222222-2222-2222-2222-222222222222",
                              "system":false,
                              "archivedAt":null}]
                            """.trimIndent(),
                        status = HttpStatusCode.OK,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = FoodsClient("http://localhost:8080", httpClient(engine), store)
            val foods = client.list()

            assertEquals(1, foods.size)
            assertEquals("Extra apple mash", foods[0].name)
            assertFalse(foods[0].system)
            assertEquals("Bearer tok", sawAuth)
        }

    @Test
    fun createUpdateArchiveHitExpectedPaths() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val paths = mutableListOf<String>()
            val engine =
                MockEngine { request ->
                    paths += "${request.method.value} ${request.url.encodedPath}"
                    val body =
                        """
                        {"id":"cccccccc-cccc-cccc-cccc-cccccccccccc",
                         "name":"Food",
                         "iconKey":"apple",
                         "householdId":"22222222-2222-2222-2222-222222222222",
                         "system":false,
                         "archivedAt":null}
                        """.trimIndent()
                    val status =
                        if (request.method == HttpMethod.Post &&
                            request.url.encodedPath == "/api/foods"
                        ) {
                            HttpStatusCode.Created
                        } else {
                            HttpStatusCode.OK
                        }
                    respond(
                        content = body,
                        status = status,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = FoodsClient("http://localhost:8080", httpClient(engine), store)
            client.create("Food", "apple")
            client.update("cccccccc-cccc-cccc-cccc-cccccccccccc", name = "Renamed")
            client.archive("cccccccc-cccc-cccc-cccc-cccccccccccc")

            assertEquals(
                listOf(
                    "POST /api/foods",
                    "PUT /api/foods/cccccccc-cccc-cccc-cccc-cccccccccccc",
                    "POST /api/foods/cccccccc-cccc-cccc-cccc-cccccccccccc/archive",
                ),
                paths,
            )
        }

    @Test
    fun invalidIconSurfacesApiMessage() =
        runTest {
            val store = InMemoryTokenStore()
            store.saveToken("tok", rememberMe = true)
            val engine =
                MockEngine {
                    respond(
                        content = """{"message":"Invalid icon key"}""",
                        status = HttpStatusCode.BadRequest,
                        headers = headersOf(HttpHeaders.ContentType, "application/json"),
                    )
                }

            val client = FoodsClient("http://localhost:8080", httpClient(engine), store)
            val error =
                assertFailsWith<FoodsException> {
                    client.create("Bad", "nope")
                }
            assertEquals("Invalid icon key", error.message)
        }

    @Test
    fun requiresSignedInToken() =
        runTest {
            val client =
                FoodsClient(
                    "http://localhost:8080",
                    httpClient(MockEngine { error("unreachable") }),
                    InMemoryTokenStore(),
                )
            val error = assertFailsWith<FoodsException> { client.list() }
            assertEquals("Not signed in", error.message)
        }

    private fun httpClient(engine: MockEngine): HttpClient =
        HttpClient(engine) {
            install(ContentNegotiation) {
                json(Json { ignoreUnknownKeys = true })
            }
        }
}
