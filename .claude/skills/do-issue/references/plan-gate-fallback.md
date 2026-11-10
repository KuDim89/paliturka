# Plan gate fallback: plan in chat

Use it when `EnterPlanMode` is not in the tool list, fails, is declined, or plan mode can't be used in the current mode. Say once that the fallback is in use and why.

- Ask questions in chat or with AskUserQuestion.
- Post the plan in chat, with the same content a plan-mode plan would have. End it with "Approve this plan?" in the user's language.
- Approval is an explicit yes with no requested changes («так», «yes», «ок», «давай» and the like). Anything else (changes, questions, silence, a partial yes) → not approved: revise and post again.
- Until approval, keep to plan-mode limits yourself: read-only commands only, no edits, no git or GitHub writes.
- There is no plan file in this mode.
- The report names the gate mode as "chat fallback".
