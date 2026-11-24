# Profile: infrastructure

For Terraform / OpenTofu, Kubernetes / Helm, CI/CD pipelines, and deployment repos.

## Folders

| Folder | What goes there |
|---|---|
| `environments/` | One page per environment (dev, staging, prod): what runs where, differences, access |
| `services/` | One page per deployed service: how it is built, deployed, scaled, configured, monitored |
| `runbooks/` | Step-by-step procedures: deploy, roll back, rotate a secret (names only), restore a backup, scale up |
| `modules/` | `catalog.md` of Terraform modules, charts and pipelines |

Page types: `environment | service | runbook | module | decision | incident`

## Build first

1. Overview: accounts / projects, networks, environments, and how traffic reaches services
2. The deploy pipeline from merge to production
3. Secrets management (where secrets live and who can read them, never the values)
4. Backups and restore
5. Monitoring, alerts and on-call

## What to look for

- Drift between environments
- Resources created by hand, outside code
- Broad IAM permissions, public endpoints, open security groups
- Single points of failure and missing backups
