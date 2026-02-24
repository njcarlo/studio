# 🌿 Branching Strategy: GitHub Flow

This repository follows the **GitHub Flow** branching strategy. This lightweight workflow ensures our `main` branch is always stable and ready for deployment, while allowing for rapid, continuous development of features and bug fixes.

## 🌳 Branch Architecture

### `main`
* **Purpose:** The production-ready state of the application. 
* **Rules:**
  * **NEVER** commit directly to `main`.
  * All code in `main` must be tested, reviewed, and deployable.
  * Changes are only integrated into `main` via approved Pull Requests (PRs).

### Feature & Fix Branches
* **Purpose:** All active development happens here. 
* **Rules:**
  * Created by branching off `main`.
  * Keep branches short-lived and focused on a single task or issue.
  * Delete the branch locally and remotely once merged.

---

## 🔄 The Workflow

1. **Update your local `main`:**
   Always start from the latest production code to prevent merge conflicts.
   `git checkout main`
   `git pull origin main`

2. **Create a new branch:**
   Name it according to our conventions (see below).
   `git checkout -b feature/user-authentication`

3. **Make changes and commit:**
   Write clear, semantic commit messages. Commit often to save your progress.
   `git add .`
   `git commit -m "feat: add JWT authentication to LoginController.cs"`

4. **Push your branch to the remote repository:**
   `git push -u origin feature/user-authentication`

5. **Open a Pull Request (PR):**
   * Go to the repository on GitHub and open a PR against the `main` branch.
   * Fill out the PR template, linking any relevant tracking tickets or issues.
   * Request a code review from at least one other team member.

6. **Review, Approve, and Merge:**
   * Address any feedback from the code review. 
   * Once approved, merge the PR into `main`.
   * **Clean up:** Delete your feature branch after merging to keep the repository tidy.

---

## 🏷️ Naming Conventions

To keep our repository organized, please use the following prefixes for your branch names:

| Prefix | Use Case | Example |
| :--- | :--- | :--- |
| `feature/` or `feat/` | Developing a new feature | `feature/commission-calculator` |
| `fix/` or `bugfix/` | Fixing an issue or bug | `fix/sql-timeout-error` |
| `docs/` | Updating documentation | `docs/api-endpoints` |
| `refactor/` | Restructuring existing code without changing behavior | `refactor/database-context` |

---

## 💬 Commit Message Guidelines

We use **Semantic Commit Messages** to make our repository history easy to read and understand at a glance. 

**Format:** `<type>: <description>`

**Examples:**
* `feat: create stored procedure for monthly sales totals`
* `fix: resolve null reference exception in DataGrid binding`
* `docs: update setup instructions in README`
* `style: format C# files to standard spacing`
