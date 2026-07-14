import SwiftUI
import SharedLogic

struct ContentView: View {
    @State private var mode: AuthMode = .signIn
    @State private var email = ""
    @State private var password = ""
    @State private var rememberMe = true
    @State private var signedInEmail: String?
    @State private var statusText: String?
    @State private var errorText: String?
    @State private var isBusy = false
    @State private var isBootstrapping = true

    private let auth = AuthBridge()

    var body: some View {
        Group {
            if isBootstrapping {
                ProgressView("Checking session…")
            } else if let signedInEmail {
                signedInView(email: signedInEmail)
            } else {
                signInForm
            }
        }
        .padding()
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .onAppear(perform: restoreSession)
    }

    private var signInForm: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("quickapp")
                .font(.largeTitle.bold())
            Text(mode == .signIn
                 ? "Sign in on this iPad to run tasting sessions."
                 : "Create a parent account for this household.")
                .foregroundStyle(.secondary)

            Picker("Mode", selection: $mode) {
                Text("Sign in").tag(AuthMode.signIn)
                Text("Create account").tag(AuthMode.register)
            }
            .pickerStyle(.segmented)

            TextField("Email", text: $email)
                .textInputAutocapitalization(.never)
                .keyboardType(.emailAddress)
                .autocorrectionDisabled()
                .textFieldStyle(.roundedBorder)

            SecureField("Password", text: $password)
                .textFieldStyle(.roundedBorder)

            Toggle("Keep me logged in", isOn: $rememberMe)

            if let statusText {
                Text(statusText)
                    .foregroundStyle(.secondary)
            }
            if let errorText {
                Text(errorText)
                    .foregroundStyle(.red)
            }

            Button(mode == .signIn ? "Sign in" : "Create account") {
                submit()
            }
            .buttonStyle(.borderedProminent)
            .disabled(isBusy || email.isEmpty || password.count < 8)
        }
        .frame(maxWidth: 420)
    }

    private func signedInView(email: String) -> some View {
        VStack(spacing: 16) {
            Text("quickapp")
                .font(.largeTitle.bold())
            Text("Signed in as \(email)")
            if let errorText {
                Text(errorText)
                    .foregroundStyle(.red)
            }
            Button("Sign out") {
                signOut()
            }
            .buttonStyle(.bordered)
            .disabled(isBusy)
        }
    }

    private func restoreSession() {
        auth.restoreSession(
            onSignedIn: { email in
                signedInEmail = email
                isBootstrapping = false
            },
            onSignedOut: {
                signedInEmail = nil
                isBootstrapping = false
            }
        )
    }

    private func submit() {
        errorText = nil
        statusText = mode == .signIn ? "Signing in…" : "Creating account…"
        isBusy = true
        let onSuccess: (String) -> Void = { email in
            signedInEmail = email
            password = ""
            statusText = nil
            isBusy = false
        }
        let onError: (String) -> Void = { message in
            errorText = message
            statusText = nil
            isBusy = false
        }
        if mode == .register {
            auth.register(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                rememberMe: rememberMe,
                onSuccess: onSuccess,
                onError: onError
            )
        } else {
            auth.login(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                rememberMe: rememberMe,
                onSuccess: onSuccess,
                onError: onError
            )
        }
    }

    private func signOut() {
        errorText = nil
        isBusy = true
        auth.logout(
            onSuccess: {
                signedInEmail = nil
                isBusy = false
            },
            onError: { message in
                errorText = message
                isBusy = false
            }
        )
    }
}

private enum AuthMode {
    case signIn
    case register
}

struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
    }
}
