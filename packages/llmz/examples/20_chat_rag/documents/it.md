# 📘 IT Department Handbook

## 📌 Overview

Welcome to the internal IT handbook. This document outlines standard policies, procedures, and troubleshooting guidelines for internal technical support. It is designed for employees, IT support staff, and third-party contractors working within the company infrastructure.

---

## 🔐 IT Security Policies

### 1. Password Management

- Use a password manager (we recommend **1Password**).
- Passwords must be at least 16 characters long and include:
  - Uppercase and lowercase letters
  - Numbers
  - Special characters
- Change passwords every 90 days.
- Do not reuse passwords across accounts.

### 2. Multi-Factor Authentication (MFA)

- MFA is mandatory for:
  - Email (Google Workspace)
  - VPN access
  - Admin-level access to internal tools
- Use either **Google Authenticator** or **YubiKey**.

### 3. Device Security

- Company-issued laptops must:
  - Be encrypted using FileVault (macOS) or BitLocker (Windows)
  - Have antivirus software installed (CrowdStrike Falcon)
  - Enable firewall
- Personal devices are **not permitted** to access production environments.

---

## 🛠 Troubleshooting Guides

### 1. VPN Connectivity Issues

**Symptoms:**

- Cannot access internal services
- "Authentication Failed" error

**Steps:**

1. Ensure you're connected to the internet.
2. Open the **NordLayer VPN** app.
3. Select the closest region (usually `us-east-1`).
4. Ensure MFA is successful.
5. If issues persist, reboot and retry.

**Escalation:**
If the issue persists after 3 attempts, contact IT Support via Slack `#it-support`.

---

### 2. Slack Not Syncing

**Symptoms:**

- Messages delayed or unsent
- Channel list not updating

**Steps:**

1. Quit and reopen the Slack desktop app.
2. Clear cache: `Cmd + Shift + .` → Select "Clear Cache and Restart".
3. Check system clock sync.
4. Ensure port `443` is not blocked.

**Note:** Slack is considered a Tier-1 critical tool.

---

## 🧑‍💻 New Employee IT Onboarding

### Checklist (First 24 Hours)

| Task                            | Responsible | Due   |
| ------------------------------- | ----------- | ----- |
| Provision laptop                | IT Support  | Day 0 |
| Create Google Workspace account | IT Support  | Day 0 |
| Add to Slack & Zoom             | People Ops  | Day 0 |
| Set up GitHub + SSO             | IT Support  | Day 1 |
| Assign project-level access     | Team Lead   | Day 1 |

### Setup Script (macOS)

```bash
/bin/bash -c "$(curl -fsSL https://company.internal/setup)"
```

### Accounts Created Automatically

- Google Workspace
- Slack
- Zoom
- GitHub Enterprise
- Notion

---

## 🧰 Developer Environment Guidelines

### Approved Tech Stack

- Language: TypeScript, Python
- Backend: Node.js, FastAPI
- Frontend: React (w/ Vite)
- Infra: AWS (ECS, RDS), Terraform
- CI/CD: GitHub Actions

### Local Dev Setup

1. Clone from GitHub.
2. Run `make dev-up`.
3. Visit `http://localhost:3000`.

### Linting & Formatting

```bash
pnpm lint
pnpm format
```

---

## 🔄 Software Update Policy

### Automatic Updates (Enforced)

- Google Chrome
- VS Code
- GitHub CLI

### Manual Updates (Monthly Reminder)

- Docker Desktop
- Postman
- Terminal tools (oh-my-zsh, nvm, etc.)

**Non-compliance:** Device may be quarantined automatically after 2 missed updates.

---

## 🛡 Incident Response Plan (IRP)

| Severity | Definition                     | Action                                   |
| -------- | ------------------------------ | ---------------------------------------- |
| SEV-1    | Data breach, production outage | Notify IT, CISO, and Legal immediately   |
| SEV-2    | Unauthorized access attempt    | Isolate endpoint, reset credentials      |
| SEV-3    | Phishing email reported        | Investigate, alert company, educate user |

### Communication Channel

Use `#sec-incident-response` on Slack. Do **not** email or use unencrypted messages.

---

## 👾 Common Errors & Fixes

| Error                           | Fix                                                                  |                 |
| ------------------------------- | -------------------------------------------------------------------- | --------------- |
| `EADDRINUSE`                    | Kill port: \`lsof -i :3000                                           | kill -9 <PID>\` |
| `Permission Denied (publickey)` | Add SSH key to GitHub                                                |                 |
| VPN DNS Resolution Fail         | Run: `sudo dscacheutil -flushcache; sudo killall -HUP mDNSResponder` |                 |

---

## 🧠 FAQs

**Q: Can I install my own software?**
A: No. Use the internal request form for custom software approvals.

**Q: How do I report a phishing email?**
A: Forward the email to `security@company.com` and notify `#sec-alerts`.

**Q: Can I work from my personal laptop?**
A: Only if you're using a company-approved virtual desktop environment (VDI).

---

## 🧑‍🚀 IT Team Contact Info

| Name            | Role              | Contact                        |
| --------------- | ----------------- | ------------------------------ |
| Alice Wong      | IT Lead           | `@alice.wong` on Slack         |
| Joe Menard      | Security Engineer | `@joe.menard` on Slack         |
| Support Channel | –                 | `#it-support` (monitored 24/7) |

---

_Last updated: 2025-05-30_
