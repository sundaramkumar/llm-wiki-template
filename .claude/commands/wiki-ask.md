---
description: Answer a question about this codebase from the wiki, check it against the code, and save useful answers
argument-hint: <question>
---
Question: $ARGUMENTS

1. Start at wiki/index.md and read the relevant pages.
2. Confirm the answer in the cited code across the repos. When the wiki and the code disagree, the code is right:
   fix the page and note the fix in log.md.
3. Answer with citations (`repo:path → symbol`) and links to wiki pages.
4. If the answer would help someone later, save it into the best page, or into a new page added to index.md.
   Say what you saved.
