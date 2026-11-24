# Stacks: what a "module" is, and what never to read

`/wiki-init` uses this file to build the module catalog and the never-read list in `CLAUDE.md`. If a stack is
missing, add it here (and copy the change back to the template).

## What counts as a module

| Stack | Detect by | One catalog row per |
|---|---|---|
| Node / Express / Fastify / NestJS | `package.json` (`express`, `fastify`, `@nestjs/*`) | Folder under `src/modules/` or `src/routes/`; NestJS `*.module.ts` |
| Deno (Oak, Hono, Fresh) | `deno.json`, `deps.ts` | Folder under `src/modules/` or `routes/` |
| Angular | `angular.json` | Feature folder under `src/app/modules/` or `src/app/features/`; lazy route |
| React / Next.js / Vue / Nuxt / Svelte | `package.json` (`react`, `next`, `vue`, `nuxt`, `svelte`) | Page or route folder (`app/`, `pages/`, `src/pages/`), or feature folder (`src/features/`) |
| Java / Kotlin (Spring Boot) | `pom.xml`, `build.gradle(.kts)` with `spring-boot` | Package under the main package (`…/order/`, `…/billing/`), or Maven / Gradle sub-module |
| .NET (ASP.NET Core) | `*.sln`, `*.csproj` | Project in the solution; inside a big project, folder under `Features/` or `Controllers/` |
| Python (Django) | `manage.py`, `settings.py` | Django app (folder with `apps.py`) |
| Python (FastAPI / Flask) | `pyproject.toml` / `requirements.txt` | Router module or package under `app/` (`routers/`, `api/`, blueprints) |
| Go | `go.mod` | Package under `internal/` or `pkg/`; each `cmd/<name>` is an entry point |
| PHP (Laravel / Symfony) | `composer.json` | Laravel: domain folder or controller group, plus `routes/*.php`; Symfony: bundle or `src/<Domain>/` |
| Ruby on Rails | `Gemfile` with `rails` | Controller plus its model; engines under `engines/` or `components/` |
| Rust | `Cargo.toml` | Crate in the workspace; inside a crate, top-level `mod` |
| Flutter | `pubspec.yaml` | Feature folder under `lib/features/` or `lib/modules/` |
| React Native / Expo | `package.json` (`react-native`, `expo`) | Screen or feature folder (`src/screens/`, `src/features/`, `app/`) |
| iOS (Swift) / Android (Kotlin) | `*.xcodeproj`, `Package.swift` / `build.gradle` with `com.android` | Feature module or target; Android Gradle module |
| Frappe / ERPNext | `hooks.py`, `modules.txt` | Frappe module, and each DocType inside it |
| dbt / SQL warehouse | `dbt_project.yml` | Model folder (`models/staging`, `models/marts/<area>`); each mart |
| Airflow / Dagster / Prefect | `dags/`, `definitions.py` | DAG or job |
| Terraform / OpenTofu | `*.tf` | Module under `modules/`; each environment root (`envs/<env>`) |
| Kubernetes / Helm | `Chart.yaml`, `k8s/`, `kustomization.yaml` | Chart or service manifest set |
| Serverless (AWS Lambda, Azure Functions) | `serverless.yml`, `template.yaml`, `host.json` | Function |

Workers, queue consumers, cron jobs, schedulers and webhook handlers always get their own rows, whatever the stack:
they are where cross-module flows usually start.

## Never read: common to every project

`.env`, `.env.*` (except `.env.example` — read for variable **names** only), `*.pem`, `*.key`, `*.p12`, `*.pfx`,
`*.jks`, `*.keystore`, `id_rsa*`, `credentials*.json`, `service-account*.json`, `secrets*.y*ml`, `*.tfvars` (except
`*.example.tfvars`), database dumps (`*.sql.gz`, `*.dump`, `*.bak`), `logs/`, `*.log`, and any folder of production
data, exports or customer files.

## Never read: per stack

| Stack | Add to the list |
|---|---|
| .NET | `appsettings.Production.json`, `appsettings.*.json` holding connection strings, `secrets.json`, `*.pubxml.user` |
| Spring | `application-prod.yml` / `.properties`, any `application-*.yml` holding passwords |
| Django / Flask | `local_settings.py`, `settings/prod.py` if it holds secrets, `instance/` |
| Rails | `config/master.key`, `config/credentials/*.key` |
| Laravel | `storage/logs/`, `storage/app/` if it holds uploads |
| Firebase / mobile | `google-services.json`, `GoogleService-Info.plist`, `key.properties`, upload keystores, provisioning profiles |
| Terraform | `*.tfstate`, `*.tfstate.backup`, `.terraform/` |
| Kubernetes | `Secret` manifests with real values, `kubeconfig*` |
| Frappe | `sites/*/site_config.json`, `sites/*/private/` |
| Node | `.npmrc` with tokens |

When unsure, leave it out and ask.
