# Messaging App UI

This is the frontend for the Messaging App, a real-time messaging application. It is a single-page application (SPA) built with Angular.

For more information about the overall project architecture, see the [root README.md](../../README.md).

## Key Components

*   **`main` page:** The main component that orchestrates the different parts of the chat application.
*   **`chat-list` component:** Displays the list of chats for the current user.
*   **Services:**
    *   `ChatService`, `MessageService`, `UserService`: These services are generated from the backend's OpenAPI specification and are used to communicate with the API.
    *   `KeycloakService`: Initializes and manages the Keycloak instance for authentication.
*   **Interceptors:**
    *   `KeycloakHttpInterceptor`: Intercepts outgoing HTTP requests and adds the Keycloak access token to the `Authorization` header.
*   **API Client Generation:** The `ng-openapi-gen` tool is used to generate the API client code from the `openapi.json` file. This ensures that the frontend and backend are always in sync.

## Technologies Used

*   **Angular**
*   **Bootstrap**
*   **Keycloak-js**
*   **SockJS & STOMPjs**
*   **ng-openapi-gen**

## Getting Started

### Prerequisites

*   Node.js and npm
*   Angular CLI

### Installation

1.  Install the dependencies:

    ```bash
    npm install
    ```

### Configuration

1.  **API URL:** The API URL is configured in the `src/app/services/api-configuration.ts` file. By default, it is set to `http://localhost:8080`.

2.  **Keycloak:** The Keycloak configuration is located in the `src/app/utils/keycloak/KeycloakService.ts` file. You will need to update the `url`, `realm`, and `clientId` to match your Keycloak server configuration.

### Running the Application

You can run the application using the Angular CLI:

```bash
ng serve
```

The application will be available at `http://localhost:4200`.

## API Client Generation

The API client is generated from the `openapi.json` file located in the `src/openapi` directory. To regenerate the client, run the following command:

```bash
npm run api-gen
```