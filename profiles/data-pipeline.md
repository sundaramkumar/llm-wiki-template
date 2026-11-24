# Profile: data pipeline / ETL / analytics

For dbt projects, Airflow / Dagster / Prefect DAGs, Spark jobs, warehouse SQL, and reporting layers.

## Folders

| Folder | What goes there |
|---|---|
| `pipelines/` | One page per pipeline or DAG: sources, steps, schedule, outputs, how it recovers from failure |
| `datasets/` | Important tables or models: grain, keys, freshness, who uses them, known caveats |
| `jobs/` | Standalone jobs and scripts that pipelines don't cover |
| `data-quality/` | Tests and checks, what they catch, known gaps, how incidents are handled |
| `modules/` | `catalog.md` of models, DAGs and jobs |

Page types: `pipeline | dataset | job | data-quality | module | decision | incident`

## Build first

1. The end-to-end path from the main source systems to the main reports
2. The 3–5 most used datasets (grain, keys, definitions of the main metrics)
3. Scheduling and dependencies between pipelines
4. Late-arriving data, backfills and reprocessing
5. Access control and personal data (masking, retention)

## What to look for

- Metric definitions that differ between models or reports
- Time zones and date boundaries
- Joins that can duplicate rows; incremental models that can miss or double-count
- Silent failures: a step that succeeds with zero rows
