# Running the app

For a dev server or any other long-running process.

1. **Port**: check that the port is free first. Taken → it may be the user's own server: never kill it; ask whether to use it or which port to use instead.
2. **Start** in the background (Bash `run_in_background`), never in the foreground, where it blocks until the timeout.
3. **Ready**: poll the URL with a bounded loop (e.g. Monitor until it answers, at most about 60 s), not a fixed `sleep`. Not ready in time → read its output, stop it, report a failed check.
4. **Check** what was needed.
5. **Stop** it right away (TaskStop) and confirm the port is free again. One server per verification round; never left running between fix cycles or at the end of the run.
6. **Port still answers after TaskStop** (on Windows TaskStop stops only the package manager, e.g. `pnpm`; the server it started keeps running):
   - Find the listener and its parent: `Get-NetTCPConnection -LocalPort <port> -State Listen`, then `Get-CimInstance Win32_Process` for the owning process and its `ParentProcessId`, with their command lines.
   - Kill only a process this run started: its command line points into this repo (e.g. `node_modules/.../next ... dev`). Anything else → don't touch it; report the PID and ask.
   - Stop the whole tree from the parent: `taskkill /PID <parent pid> /T /F`.
   - Check the port again; still taken → report the PID to stop by hand.

- Playwright: if its config starts the server itself, don't start a second one.
- Manual checks: the server may be started the same way and stopped after the user's answer; the steps give the user the URL.
- Report which servers were started and that they were stopped. Stopping failed → give the PID or port to stop by hand.
