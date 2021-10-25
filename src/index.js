const core = require("@actions/core");
const { jiraService } = require("./util/jira");

const OBSERVABLE_TARGET_BRANCHES = ["main", "qa", "develop"];

const input = {
  getSourceBranch: () => core.getInput("head_ref_branch"),
  getTargetBranch: () => core.getInput("base_ref_branch"),
};

/**
 * @returns {boolean}
 */
function isTargetBranchByPassConstrainsCheck() {
  const targetBranch = input.getTargetBranch();
  if (OBSERVABLE_TARGET_BRANCHES.indexOf(targetBranch) === -1) {
    core.info(
      "Nothing to do or check the pull request did not target branches that require contrains to be checked"
    );
    return true;
  }
  return false;
}

async function run() {
  try {
    if (isTargetBranchByPassConstrainsCheck()) {
      return;
    }

    const jiraIssue = await jiraService.getHighestRankJiraIssue(
      input.getSourceBranch()
    );
    if (!jiraIssue) {
      const msg =
        "No jira issue found in the head branch name of pull request : " +
        input.getSourceBranch();
      core.setFailed(msg);
      return;
    }

    if (!jiraService.hasFixedVersion(jiraIssue)) {
      const msg = "No fixed version on the issue : " + jiraIssue.reference;
      core.setFailed(msg);
    }
  } catch (error) {
    core.setFailed(error.message);
  }
}

run().then(/*nothing to do*/);
