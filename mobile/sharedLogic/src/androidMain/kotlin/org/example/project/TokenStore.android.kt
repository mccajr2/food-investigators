package org.example.project

actual fun platformTokenStore(): TokenStore = InMemoryTokenStore()
