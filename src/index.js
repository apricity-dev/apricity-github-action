const core = require("@actions/core");
const { jiraService } = require("./util/jira");

const PRINCIPAL_BRANCHES = ["main", "qa", "develop"];

const input = {
  getSourceBranch: () => core.getInput("head_ref_branch"),
  getTargetBranch: () => core.getInput("base_ref_branch"),
};

/**
 * @returns {boolean}
 */
function byPassConstrainsCheck() {
  const sourceBranch = input.getSourceBranch();
  const targetBranch = input.getTargetBranch();

  const isSourcePrincipal = PRINCIPAL_BRANCHES.indexOf(sourceBranch) !== -1;
  const isTargetPrincipal = PRINCIPAL_BRANCHES.indexOf(targetBranch) !== -1;

  if (!isTargetPrincipal) {
    core.info(
      "Nothing to do or check the pull request did not target branches that require contrains to be checked"
    );
    return true;
  }
  if(isSourcePrincipal && isTargetPrincipal){
    core.info(
        "Nothing to do or check the pull request merge a principal branch to another"
    );
    return true;
  }
  return false;
}

async function run() {
  try {
    if (byPassConstrainsCheck()) {
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
