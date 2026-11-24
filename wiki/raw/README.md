# raw/: evidence that lives outside git (read-only)

Put material here only if it **doesn't already live in one of the code repos**. For example:

- Plan or design documents kept outside the repos
- QA or bug reports, converted from .docx or .pdf to markdown first
- Incident notes or postmortems written outside the repos

Docs that already live in a repo are cited in place (`<repo>:docs/SOMETHING.md`). Don't copy them here.

## Never put these here

- Anything on the never-read list in [CLAUDE.md](../../CLAUDE.md): env files, keys, certificates, credential files
- Production logs and database dumps, which may contain customer data
- Customer data of any kind (contact lists, exports, screenshots with personal data)

Remove any secret or customer data from a document before adding it.
