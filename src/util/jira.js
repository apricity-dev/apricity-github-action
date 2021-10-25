const JiraClient = require("jira-client");
const core = require("@actions/core");

const JIRA_ISSUE_TYPES_ORDERED = [
  {
    name: "Story",
    avatarId: 10315,
  },
  {
    name: "Bug",
    avatarId: 10303,
  },
  {
    name: "Sous-tâche",
    avatarId: 10316,
  },
];
const JIRA_ISSUE_TYPE_ORDER_MAP = {};
JIRA_ISSUE_TYPES_ORDERED.forEach(
  (type, index) => (JIRA_ISSUE_TYPE_ORDER_MAP[type.avatarId] = index + 1)
);

const input = {
  getUsername: () => core.getInput("jira_username"),
  getPassword: () => core.getInput("jira_password"),
  getIssuePrefixes: () => {
    const config = core.getInput("jira_issue_prefix");
    return config.split(",").map((s) => s.trim());
  },
};

const jiraClient = new JiraClient({
  protocol: "https",
  host: "apricity.atlassian.net",
  username: input.getUsername(),
  password: input.getPassword(),
  apiVersion: "2",
  strictSSL: true,
});

/**
 * @param issue
 * @returns {boolean}
 */
function hasFixedVersion(issue) {
  return issue.fields.fixVersions.length !== 0;
}

/**
 * @param issueReference
 * @returns {Promise<*>}
 */
async function findIssue(issueReference) {
  const issue = await jiraClient.findIssue(issueReference);
  if (issue) {
    issue.reference = issueReference;
  }
  return issue;
}

/**
 *
 * @param issuePrefix
 * @param str
 * @returns {*[]|*}
 */
function extractReferencesFromString(issuePrefix, str) {
  const regex = new RegExp(`${issuePrefix}-\\d+`, "gm");
  const issueReferences = str.match(regex);
  if (!issueReferences) {
    return [];
  }
  return issueReferences.map((r) => r + "");
}

/**
 * @param str
 * @returns {*}
 */
function extractJiraIssueReferencesFromString(str) {
  const issuePrefixes = input.getIssuePrefixes();
  return issuePrefixes.flatMap((issuePrefix) =>
    extractReferencesFromString(issuePrefix, str)
  );
}

/**
 * @param issue
 * @returns {number|*}
 */
function getIssueTypeOrder(issue) {
  const avatarId = issue.issuetype ? issue.issuetype.avatarId : 0;
  if (!JIRA_ISSUE_TYPES_ORDERED.hasOwnProperty(avatarId)) {
    // In case we didn't know the issue type
    return JIRA_ISSUE_TYPES_ORDERED.length;
  }
  return JIRA_ISSUE_TYPE_ORDER_MAP[avatarId];
}

/**
 * @returns {any|undefined}
 */
async function getHighestRankJiraIssue(str) {
  const issueReferences = extractJiraIssueReferencesFromString(str);
  if (issueReferences.length === 0) {
    return undefined;
  }
  const issues = [];
  for (const ref of issueReferences) {
    try {
      const issue = await findIssue(ref);
      issues.push(issue);
    } catch (e) {
      console.error(e);
    }
  }
  issues.sort((t1, t2) => getIssueTypeOrder(t1) - getIssueTypeOrder(t2));
  return issues[0];
}

const jiraService = {
  hasFixedVersion,
  getHighestRankJiraIssue,
};

module.exports = { jiraService };
