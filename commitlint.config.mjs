// Conventional Commits, enforced by the commit-msg hook (Lefthook) and in CI.
// Allowed types: build, chore, ci, docs, feat, fix, perf, refactor, revert,
// style, test. Example: `feat(waitlist): add referral code field`.
export default {
  extends: ["@commitlint/config-conventional"],
  rules: {
    // Dependency-bot and revert commits carry long bodies/changelogs; don't
    // fail on line length there.
    "body-max-line-length": [0, "always"],
    "footer-max-line-length": [0, "always"],
  },
};
