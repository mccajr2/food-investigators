package org.example.project

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.get
import io.ktor.client.request.header
import io.ktor.client.request.post
import io.ktor.client.request.put
import io.ktor.client.request.setBody
import io.ktor.client.statement.HttpResponse
import io.ktor.client.statement.bodyAsText
import io.ktor.http.ContentType
import io.ktor.http.HttpHeaders
import io.ktor.http.contentType
import io.ktor.http.isSuccess
import kotlinx.serialization.Serializable
import kotlinx.serialization.json.Json

@Serializable
data class FoodResponse(
    val id: String,
    val name: String,
    val iconKey: String,
    val householdId: String? = null,
    val system: Boolean,
    val archivedAt: String? = null,
)

@Serializable
data class CreateFoodRequest(
    val name: String,
    val iconKey: String,
)

@Serializable
data class UpdateFoodRequest(
    val name: String? = null,
    val iconKey: String? = null,
)

class FoodsException(message: String) : Exception(message)

class FoodsClient(
    private val baseUrl: String,
    private val httpClient: HttpClient = createHttpClient(),
    private val tokens: TokenStore = platformTokenStore(),
) {
    suspend fun list(includeArchived: Boolean = false): List<FoodResponse> {
        val query = if (includeArchived) "?includeArchived=true" else ""
        val response =
            authorizedGet("$baseUrl/api/foods$query")
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
        return response.body()
    }

    suspend fun create(name: String, iconKey: String): FoodResponse {
        val response =
            httpClient.post("$baseUrl/api/foods") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(CreateFoodRequest(name, iconKey))
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
        return response.body()
    }

    suspend fun update(
        foodId: String,
        name: String? = null,
        iconKey: String? = null,
    ): FoodResponse {
        val response =
            httpClient.put("$baseUrl/api/foods/$foodId") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(UpdateFoodRequest(name, iconKey))
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
        return response.body()
    }

    suspend fun archive(foodId: String): FoodResponse {
        val response =
            httpClient.post("$baseUrl/api/foods/$foodId/archive") {
                header(HttpHeaders.Authorization, bearerOrThrow())
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
        return response.body()
    }

    private suspend fun authorizedGet(url: String): HttpResponse {
        val response =
            httpClient.get(url) {
                header(HttpHeaders.Authorization, bearerOrThrow())
            }
        clearTokenIfUnauthorized(response)
        return response
    }

    private fun bearerOrThrow(): String {
        val token = tokens.getToken() ?: throw FoodsException("Not signed in")
        return "Bearer $token"
    }

    private fun clearTokenIfUnauthorized(response: HttpResponse) {
        if (response.status.value == 401) {
            tokens.clearToken()
        }
    }

    private val errorJson = Json { ignoreUnknownKeys = true }

    private suspend fun readError(response: HttpResponse): String {
        val text =
            runCatching { response.bodyAsText() }.getOrNull()
                ?: return "Foods request failed (${response.status})"
        val parsed =
            runCatching {
                errorJson.decodeFromString(ErrorMessage.serializer(), text)
            }.getOrNull()
        return parsed?.message ?: "Foods request failed (${response.status})"
    }

    companion object {
        fun create(
            baseUrl: String = apiBaseUrl(),
            tokens: TokenStore = platformTokenStore(),
        ): FoodsClient = FoodsClient(baseUrl, createHttpClient(), tokens)
    }
}
