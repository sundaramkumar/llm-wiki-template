# Profile: mobile app

For Flutter, React Native / Expo, or native iOS / Android apps, usually with a backend API in another repo.

## Folders

| Folder | What goes there |
|---|---|
| `screens/` | One page per important screen or screen group: what it shows, where the data comes from, navigation in and out |
| `flows/` | Journeys across screens and the API: onboarding, sign-in, purchase, offline sync, push notification → screen |
| `platform/` | iOS and Android specifics: permissions, deep links, push setup, background tasks, native modules |
| `releases/` | Build flavours and environments, signing (names only, never keys), store release steps, feature flags |
| `modules/` | `catalog.md`, plus shared services (API client, storage, auth, analytics) |

Page types: `screen | flow | platform | release | module | decision | incident`

## Build first

1. App start: initialisation, auth state, routing to the first screen
2. Sign-in and session refresh
3. The 2–3 core journeys
4. API client and error handling; offline and caching behaviour
5. Push notifications and deep links
6. Build flavours and release process

## What to look for

- Behaviour that differs between iOS and Android
- What happens offline, on a slow network, or when the app is killed mid-action
- Tokens and personal data stored on the device
- Minimum supported OS / app versions and forced-update logic
