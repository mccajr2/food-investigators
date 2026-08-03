package org.example.project

import io.ktor.client.HttpClient
import io.ktor.client.call.body
import io.ktor.client.request.delete
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
data class FoodExposureResponse(
    val foodId: String,
    val variantKey: String,
    val familiarity: String,
    val source: String,
    val attemptCount: Int? = null,
    val lastTriedOn: String? = null,
    val lastLiked: String? = null,
)

@Serializable
data class FoodResponse(
    val id: String,
    val name: String,
    val iconKey: String,
    val iconUrl: String? = null,
    val householdId: String? = null,
    val system: Boolean,
    val sessionEligible: Boolean = true,
    val liked: String? = null,
    val texture: String? = null,
    val tasteNote: String? = null,
    val archivedAt: String? = null,
    val exposures: List<FoodExposureResponse> = emptyList(),
)

@Serializable
data class CreateFoodRequest(
    val name: String,
    val iconKey: String,
    val sessionEligible: Boolean? = null,
    val liked: String? = null,
    val texture: String? = null,
    val tasteNote: String? = null,
)

@Serializable
data class UpdateFoodRequest(
    val name: String? = null,
    val iconKey: String? = null,
    val sessionEligible: Boolean? = null,
    val liked: String? = null,
    val texture: String? = null,
    val tasteNote: String? = null,
)

@Serializable
data class UpsertFoodExposureRequest(
    val variantKey: String? = null,
    val familiarity: String,
)

@Serializable
data class BootstrapSafeItemRequest(
    val name: String,
    val variantKey: String? = null,
    val sessionEligible: Boolean? = null,
)

@Serializable
data class BootstrapSafesRequest(
    val items: List<BootstrapSafeItemRequest>,
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

    suspend fun create(
        name: String,
        iconKey: String,
        sessionEligible: Boolean? = null,
        liked: String? = null,
        texture: String? = null,
        tasteNote: String? = null,
    ): FoodResponse {
        val response =
            httpClient.post("$baseUrl/api/foods") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(
                    CreateFoodRequest(
                        name = name,
                        iconKey = iconKey,
                        sessionEligible = sessionEligible,
                        liked = liked,
                        texture = texture,
                        tasteNote = tasteNote,
                    ),
                )
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
        return response.body()
    }

    suspend fun bootstrapSafes(items: List<BootstrapSafeItemRequest>): List<FoodExposureResponse> {
        val response =
            httpClient.post("$baseUrl/api/foods/bootstrap-safes") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(BootstrapSafesRequest(items = items))
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
        sessionEligible: Boolean? = null,
        liked: String? = null,
        texture: String? = null,
        tasteNote: String? = null,
    ): FoodResponse {
        val response =
            httpClient.put("$baseUrl/api/foods/$foodId") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(
                    UpdateFoodRequest(
                        name = name,
                        iconKey = iconKey,
                        sessionEligible = sessionEligible,
                        liked = liked,
                        texture = texture,
                        tasteNote = tasteNote,
                    ),
                )
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

    suspend fun upsertExposure(
        foodId: String,
        familiarity: String,
        variantKey: String? = null,
    ): FoodExposureResponse {
        val response =
            httpClient.put("$baseUrl/api/foods/$foodId/exposures") {
                header(HttpHeaders.Authorization, bearerOrThrow())
                contentType(ContentType.Application.Json)
                setBody(
                    UpsertFoodExposureRequest(
                        variantKey = variantKey,
                        familiarity = familiarity,
                    ),
                )
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
        return response.body()
    }

    suspend fun clearExposure(foodId: String, variantKey: String = "") {
        val encoded =
            if (variantKey.isEmpty()) {
                ""
            } else {
                "?variantKey=" + variantKey.encodeURLParameter()
            }
        val response =
            httpClient.delete("$baseUrl/api/foods/$foodId/exposures$encoded") {
                header(HttpHeaders.Authorization, bearerOrThrow())
            }
        clearTokenIfUnauthorized(response)
        if (!response.status.isSuccess()) {
            throw FoodsException(readError(response))
        }
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

private fun String.encodeURLParameter(): String =
    buildString(length + 8) {
        for (ch in this@encodeURLParameter) {
            when {
                ch.isLetterOrDigit() || ch == '-' || ch == '_' || ch == '.' || ch == '~' -> append(ch)
                else -> {
                    val bytes = ch.toString().encodeToByteArray()
                    for (b in bytes) {
                        append('%')
                        append(((b.toInt() shr 4) and 0xF).toString(16).uppercase())
                        append((b.toInt() and 0xF).toString(16).uppercase())
                    }
                }
            }
        }
    }
