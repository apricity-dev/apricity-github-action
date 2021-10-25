const {jiraService} = require("./jira");

const references = jiraService.extractReferencesFromString("APR", "APR-2675 APR-123");

console.log(references);
