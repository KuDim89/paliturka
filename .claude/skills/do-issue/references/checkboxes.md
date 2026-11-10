# Ticking the issue checkboxes

`gh issue edit --body-file` overwrites the whole body, and the issue may have changed during hours of work. So:

1. **Re-fetch** right before editing: `gh issue view N --json body` → the **fresh body**. Never use the body read in preflight.
2. **Changed since preflight** → show what changed. New or reworded Tasks or criteria are not ticked; ask: verify them (back to step 8, plan gate if work is needed) or leave them unticked and report.
3. **What may be ticked**:
   - **Acceptance criterion**: passed automatically, or manually by the user's explicit yes (marked as manual in the diff).
   - **Task**: its plan step is done and the checks that cover it have passed.
   - Unverified items are never ticked.
4. **New body** = the fresh body with only those lines changed, `- [ ] <text>` → `- [x] <text>`, matched by exact text. Everything else stays unchanged: spacing, other sections, items ticked by someone else. A line missing or reworded, or the same text on several lines → not ticked, reported.
5. **Diff**: show only the changed lines in a ```diff block (`-` old line, `+` new line) and their count; wait for an explicit OK. Nothing to tick → skip the edit.
6. **Edit**: after the OK, re-fetch once more. Differs from the fresh body → don't edit, go back to 1. Equal → `gh issue edit N --body-file -` with the new body in a quoted heredoc:

   ```bash
   gh issue edit N --body-file - <<'DO_ISSUE_EOF'
   <new body>
   DO_ISSUE_EOF
   ```

   The delimiter must not appear as a whole line in the body; if it does, use another one.
7. **Verify**: `gh issue view N --json body` equals the new body. Compare line by line, ignoring line endings: bodies edited on github.com often use CRLF, the heredoc sends LF, and that is not a content change. Any other difference → report both bodies; never retry the edit blindly.
