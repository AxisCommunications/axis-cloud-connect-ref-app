# Glossary

Key terms used throughout this project.

## Axis Cloud Connect

| Term | Full Name | Description |
| ---- | --------- | ----------- |
| **ACC** | Axis Cloud Connect | Axis's cloud platform for managing devices, video, and events. The main product this reference app demonstrates. |
| **ARN** | Axis Resource Name | Unique identifier for resources in ACC (e.g., `arn:organization:abc123`, `arn:device:xyz`). Similar in concept to AWS ARNs. |
| **Resource group** | — | A folder-like grouping of devices within an ACC organization. Groups can be nested (`parentId`). The device menu lists groups and loads each group's devices on expand via `devices?resourceGroupId=`. |
| **EdgeLink** | — | Cloud-to-device routing service. Routes VAPIX requests from the cloud to on-premise Axis devices without requiring direct network access. |
| **VAPIX** | — | Axis's HTTP-based API for controlling cameras and other devices. Covers settings, PTZ, overlays, recording, and more. Accessed through EdgeLink in cloud deployments. |
| `acc` | — | Code identifier for Axis Cloud Connect. Used in the `VITE_ACC_BASE_URL` env var and the `api/acc/` folder, which holds the Cloud Connect REST API client. |
| **Axis Developer Portal** | — | Where Axis Developer Partners register OAuth 2.0 clients to get the client ID and secret this app needs: <https://portal.connect.developer.axis.com/> |

## Video & Streaming

| Term | Full Name | Description |
| ---- | --------- | ----------- |
| **WebRTC** | Web Real-Time Communication | Browser-native protocol for peer-to-peer video/audio streaming. Used for both live view and playback. |
| **SDP** | Session Description Protocol | Format for describing multimedia sessions. Exchanged during WebRTC connection setup (offer/answer). |
| **ICE** | Interactive Connectivity Establishment | Protocol for finding the best network path between peers in WebRTC. |
| **PTZ** | Pan/Tilt/Zoom | Camera movement controls. |

## Web & Security

| Term | Full Name | Description |
| ---- | --------- | ----------- |
| **OAuth 2.0** | Open Authorization 2.0 | Authorization framework used for user login. This app uses the Authorization Code flow with a confidential client (`client_id` + `client_secret`) and PKCE. |
| **PKCE** | [Proof Key for Code Exchange](https://datatracker.ietf.org/doc/html/rfc7636) | Extension to the Authorization Code flow that ties the authorization code to the login that requested it, using a one-time `code_verifier`/`code_challenge` pair. Used on every login in this app. |
| **CSRF** | Cross-Site Request Forgery | Attack mitigated with OAuth `state` validation during authorization (the `state` must match a browser-bound HttpOnly cookie) and session-bound synchronizer tokens on other state-changing requests. |
| **CORS** | Cross-Origin Resource Sharing | Browser security mechanism. The backend allows only the frontend origin. |
| **SPA** | Single Page Application | The frontend architecture — a single HTML page with client-side routing (React Router). |
| **BFF** | [Backend for Frontend](https://bff-patterns.com/) | Architecture pattern where a backend serves a specific frontend. This app's backend handles only OAuth 2.0 login and keeps refresh/ID tokens on the server; the frontend calls Axis APIs directly with the access token. |

## Device & Protocol

| Term | Full Name | Description |
| ---- | --------- | ----------- |
| **CGI** | Common Gateway Interface | URL path convention used by VAPIX endpoints (e.g., `axis-cgi/param.cgi`). |
| **OAK** | Owner Authentication Key | Key used when registering a device in ACC. Proves device ownership. |
