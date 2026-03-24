# Agent Teams Master Reference Guide

> Source: https://code.claude.com/docs/en/agent-teams
> Last updated: 2026-03-23
> Requires: Claude Code v2.1.32+

---

## Table of Contents

1. [Overview](#overview)
2. [Enabling Agent Teams](#enabling-agent-teams)
3. [When to Use Agent Teams vs Subagents](#when-to-use-agent-teams-vs-subagents)
4. [Architecture](#architecture)
5. [Starting a Team](#starting-a-team)
6. [Display Modes](#display-modes)
7. [Team Control & Communication](#team-control--communication)
8. [Task Management](#task-management)
9. [Permissions & Context](#permissions--context)
10. [Best Practices](#best-practices)
11. [Use Case Examples](#use-case-examples)
12. [Prompt Templates](#prompt-templates)
13. [Troubleshooting](#troubleshooting)
14. [Limitations](#limitations)
15. [Quick Reference Cheat Sheet](#quick-reference-cheat-sheet)

---

## Overview

Agent teams coordinate multiple Claude Code instances working together. One session acts as the **team lead**, coordinating work, assigning tasks, and synthesizing results. **Teammates** work independently, each in its own context window, and can communicate directly with each other.

Key difference from subagents: teammates can message each other directly and share a task list, whereas subagents can only report back to the caller.

---

## Enabling Agent Teams

Agent teams are **disabled by default**. Enable via settings.json:

```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  }
}
```

Or set the environment variable `CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS=1` in your shell.

---

## When to Use Agent Teams vs Subagents

### Use Agent Teams When:
- **Research & review**: multiple teammates investigate different aspects simultaneously
- **New modules/features**: teammates each own a separate piece without conflicts
- **Debugging with competing hypotheses**: test different theories in parallel
- **Cross-layer coordination**: frontend, backend, and tests each owned by a different teammate
- Teammates need to **share findings, challenge each other, and self-coordinate**

### Use Subagents When:
- Tasks are **focused and only the result matters**
- Work is **sequential** or involves same-file edits
- You need **lower token costs** (results summarized back to main context)
- Workers **don't need to communicate** with each other

### Comparison Table

| Dimension         | Subagents                                    | Agent Teams                                     |
|-------------------|----------------------------------------------|--------------------------------------------------|
| Context           | Own window; results return to caller         | Own window; fully independent                    |
| Communication     | Report back to main agent only               | Teammates message each other directly            |
| Coordination      | Main agent manages all work                  | Shared task list with self-coordination          |
| Best for          | Focused tasks where only result matters      | Complex work requiring discussion/collaboration  |
| Token cost        | Lower                                        | Higher (each teammate = separate Claude instance)|

---

## Architecture

An agent team consists of four components:

| Component      | Role                                                                     |
|----------------|--------------------------------------------------------------------------|
| **Team Lead**  | Main session that creates the team, spawns teammates, coordinates work   |
| **Teammates**  | Separate Claude Code instances that work on assigned tasks               |
| **Task List**  | Shared list of work items that teammates claim and complete              |
| **Mailbox**    | Messaging system for inter-agent communication                          |

### Storage Locations
- **Team config**: `~/.claude/teams/{team-name}/config.json`
- **Task list**: `~/.claude/tasks/{team-name}/`

### Team Config Structure
The config contains a `members` array with each teammate's:
- `name` - Human-readable name (use this for messaging and task assignment)
- `agentId` - Unique identifier (reference only)
- `agentType` - Role/type of the agent

---

## Starting a Team

Tell Claude to create a team in natural language. Claude creates the team, spawns teammates, and coordinates work.

**Example prompt:**
```
I'm designing a CLI tool that helps developers track TODO comments across
their codebase. Create an agent team to explore this from different angles:
one teammate on UX, one on technical architecture, one playing devil's advocate.
```

Claude will:
1. Create the team with a shared task list
2. Spawn teammates for each perspective
3. Have them explore the problem
4. Synthesize findings
5. Clean up the team when finished

### Specifying Teammates and Models
```
Create a team with 4 teammates to refactor these modules in parallel.
Use Sonnet for each teammate.
```

---

## Display Modes

Two modes available:

### In-Process Mode (default)
- All teammates run inside your main terminal
- **Shift+Down**: cycle through teammates
- **Enter**: view a teammate's session
- **Escape**: interrupt a teammate's current turn
- **Ctrl+T**: toggle the task list
- Works in any terminal, no extra setup

### Split-Pane Mode
- Each teammate gets its own pane
- Click into any pane to interact directly
- Requires **tmux** or **iTerm2**

### Configuration
```json
{
  "teammateMode": "in-process"  // or "tmux" or "auto" (default)
}
```

CLI override for single session:
```bash
claude --teammate-mode in-process
```

`"auto"` (default) uses split panes if already inside tmux, otherwise in-process.

---

## Team Control & Communication

### Talking to Teammates Directly
Each teammate is a full, independent Claude Code session. You can message any teammate:
- **In-process**: Shift+Down to cycle, then type
- **Split-pane**: click into the teammate's pane

### Requiring Plan Approval
For complex/risky tasks, require teammates to plan before implementing:
```
Spawn an architect teammate to refactor the authentication module.
Require plan approval before they make any changes.
```

The teammate works in **read-only plan mode** until the lead approves. If rejected, the teammate revises and resubmits.

Influence the lead's judgment with criteria:
- "Only approve plans that include test coverage"
- "Reject plans that modify the database schema"

### Messaging Patterns
- **Direct message**: send to one specific teammate by name
- **Broadcast**: send to all teammates simultaneously (use sparingly - costs scale with team size)

### Shutdown
```
Ask the researcher teammate to shut down
```
The lead sends a shutdown request. The teammate can approve (exit) or reject with explanation.

### Cleanup
```
Clean up the team
```
Always use the lead to clean up. Shut down all teammates first - cleanup fails if any are still active.

---

## Task Management

### Task States
1. **Pending** - not yet started
2. **In Progress** - currently being worked on
3. **Completed** - finished

### Task Dependencies
- Tasks can depend on other tasks
- Pending tasks with unresolved dependencies cannot be claimed
- When a dependency completes, blocked tasks automatically unblock

### Assignment Methods
- **Lead assigns**: tell the lead which task to give to whom
- **Self-claim**: teammates pick up the next unassigned, unblocked task automatically
- File locking prevents race conditions when multiple teammates try to claim the same task

### Hooks for Quality Gates
- **`TeammateIdle`**: runs when a teammate is about to go idle. Exit code 2 sends feedback and keeps them working.
- **`TaskCompleted`**: runs when a task is being marked complete. Exit code 2 prevents completion and sends feedback.

---

## Permissions & Context

### Permissions
- Teammates start with the **lead's permission settings**
- If lead runs `--dangerously-skip-permissions`, all teammates do too
- You can change individual teammate modes after spawning
- Cannot set per-teammate modes at spawn time

### Context Loading
Teammates automatically load:
- CLAUDE.md files from their working directory
- MCP servers
- Skills
- The spawn prompt from the lead

Teammates do **NOT** inherit the lead's conversation history.

### Message Delivery
- **Automatic**: messages delivered automatically to recipients
- **Idle notifications**: teammates notify the lead when they finish
- **Shared task list**: all agents see task status and claim available work

---

## Best Practices

### 1. Give Teammates Enough Context
Include task-specific details in the spawn prompt since they don't get the lead's conversation history:
```
Spawn a security reviewer teammate with the prompt: "Review the authentication
module at src/auth/ for security vulnerabilities. Focus on token handling,
session management, and input validation. The app uses JWT tokens stored in
httpOnly cookies. Report any issues with severity ratings."
```

### 2. Choose an Appropriate Team Size
- Start with **3-5 teammates** for most workflows
- Token costs scale linearly with number of teammates
- Coordination overhead increases with more teammates
- Diminishing returns beyond a certain point
- **3 focused teammates often outperform 5 scattered ones**

### 3. Size Tasks Appropriately
- **Too small**: coordination overhead exceeds the benefit
- **Too large**: teammates work too long without check-ins
- **Just right**: self-contained units that produce a clear deliverable (a function, test file, or review)
- Aim for **5-6 tasks per teammate**

### 4. Wait for Teammates to Finish
If the lead starts implementing instead of waiting:
```
Wait for your teammates to complete their tasks before proceeding
```

### 5. Start with Research and Review
If new to agent teams, start with non-coding tasks: reviewing a PR, researching a library, investigating a bug.

### 6. Avoid File Conflicts
Break work so each teammate **owns a different set of files**. Two teammates editing the same file leads to overwrites.

### 7. Monitor and Steer
Check in on progress, redirect approaches that aren't working, synthesize findings as they come in. Don't let teams run unattended too long.

### 8. Pre-approve Common Permissions
Configure permission settings before spawning to reduce interruptions from teammate permission requests.

---

## Use Case Examples

### Parallel Code Review
```
Create an agent team to review PR #142. Spawn three reviewers:
- One focused on security implications
- One checking performance impact
- One validating test coverage
Have them each review and report findings.
```
Why it works: each reviewer applies a different filter to the same PR. The lead synthesizes across all three.

### Competing Hypothesis Debugging
```
Users report the app exits after one message instead of staying connected.
Spawn 5 agent teammates to investigate different hypotheses. Have them talk to
each other to try to disprove each other's theories, like a scientific
debate. Update the findings doc with whatever consensus emerges.
```
Why it works: adversarial structure prevents anchoring bias. The theory that survives debate is more likely correct.

### Cross-Layer Feature Implementation
```
Create a team to implement the new notification system:
- One teammate owns the database schema and API endpoints
- One teammate owns the React frontend components
- One teammate owns the test suite
Have them coordinate on interfaces but work independently on implementation.
```

### Research from Multiple Angles
```
Create an agent team to explore this from different angles:
- One teammate on UX
- One on technical architecture
- One playing devil's advocate
```

---

## Prompt Templates

### General Team Creation
```
Create an agent team with [N] teammates to [task description].
[Optional: Use [model] for each teammate.]
[Optional: Require plan approval before they make changes.]
```

### Role-Based Team
```
Create a team with:
- [Role 1] focused on [area]
- [Role 2] focused on [area]
- [Role 3] focused on [area]
Have them [coordination pattern].
```

### Steering Commands
```
Wait for your teammates to complete their tasks before proceeding
Ask the [name] teammate to shut down
Clean up the team
```

---

## Troubleshooting

| Problem                        | Solution                                                                                    |
|--------------------------------|---------------------------------------------------------------------------------------------|
| Teammates not appearing        | Press Shift+Down to cycle. Check task complexity. Verify tmux if using split panes.         |
| Too many permission prompts    | Pre-approve common operations in permission settings before spawning.                       |
| Teammates stopping on errors   | Check output via Shift+Down, give instructions directly, or spawn a replacement.            |
| Lead shuts down too early      | Tell lead to wait for teammates: "Wait for teammates to finish before proceeding."          |
| Orphaned tmux sessions         | `tmux ls` then `tmux kill-session -t <session-name>`                                        |
| Task appears stuck             | Check if work is done; update task status manually or tell lead to nudge the teammate.      |

---

## Limitations

- **No session resumption** for in-process teammates (`/resume` and `/rewind` don't restore them)
- **Task status can lag** - teammates sometimes fail to mark tasks completed
- **Shutdown can be slow** - teammates finish current request before shutting down
- **One team per session** - clean up current team before starting a new one
- **No nested teams** - teammates cannot spawn their own teams
- **Lead is fixed** - can't promote a teammate or transfer leadership
- **Permissions set at spawn** - all teammates start with lead's mode
- **Split panes require tmux/iTerm2** - not supported in VS Code terminal, Windows Terminal, or Ghostty

---

## Quick Reference Cheat Sheet

### Keyboard Shortcuts (In-Process Mode)
| Key             | Action                         |
|-----------------|--------------------------------|
| Shift+Down      | Cycle through teammates        |
| Enter           | View teammate's session        |
| Escape          | Interrupt teammate's turn      |
| Ctrl+T          | Toggle task list               |

### Settings
```json
{
  "env": {
    "CLAUDE_CODE_EXPERIMENTAL_AGENT_TEAMS": "1"
  },
  "teammateMode": "in-process"  // "in-process" | "tmux" | "auto"
}
```

### CLI Flag
```bash
claude --teammate-mode in-process
```

### File Locations
| Resource      | Path                                        |
|---------------|---------------------------------------------|
| Team config   | `~/.claude/teams/{team-name}/config.json`   |
| Task list     | `~/.claude/tasks/{team-name}/`              |

### Team Sizing Guide
| Tasks          | Recommended Teammates |
|----------------|-----------------------|
| 5-10 tasks     | 2-3 teammates         |
| 10-20 tasks    | 3-4 teammates         |
| 20-30 tasks    | 4-5 teammates         |

### Token Cost Awareness
- Each teammate = separate Claude instance with its own context window
- Token usage scales linearly with active teammates
- Best ROI: research, review, new features with clear boundaries
- Worst ROI: sequential tasks, same-file edits, highly interdependent work
