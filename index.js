const core = require('@actions/core');
const github = require('@actions/github');

async function run() {
  try {
    const repository = core.getInput('repository');
    core.info(`Will check for Dependabot PRs in ${repository}`);
    const [owner, repo] = repository.split('/');

    const apiToken = core.getInput('api-token');
    const octokit = github.getOctokit(apiToken);

    const {data: openPRs} = await octokit.rest.pulls.list({
      owner,
      repo,
      state: 'open',
    });

    const dependabotPRs = openPRs.filter(pr => pr.user.login === 'dependabot[bot]');

    if (!dependabotPRs.length) {
      core.info('No open Dependabot PRs found');
      return;
    }

    core.info(`Found ${dependabotPRs.length} open Dependabot PRs`);

    const failedPRs = [];
    for (const pr of dependabotPRs) {
      const autoMergeEnabled = pr.auto_merge?.enabled_by;

      if (!autoMergeEnabled) {
        core.info(`PR ${pr.number}/"${pr.title}" has no auto-merge enabled, skipping rebase`);
        continue;
      }

      const {data: checks} = await octokit.rest.checks.listForRef({
        owner,
        repo,
        ref: pr.head.sha,
      });

      const hasFailedChecks = checks.check_runs.some(check => check.conclusion === 'failure');
      if (hasFailedChecks) {
        failedPRs.push(pr);
        core.info(`PR ${pr.number}/"${pr.title}" has failed checks, postponing rebase`);
      } else {
        core.info(`PR ${pr.number}/"${pr.title}" looks good, rebasing`);
        await octokit.rest.issues.createComment({
          owner,
          repo,
          issue_number: pr.number,
          body: '@dependabot rebase',
        });
        return;
      }
    }

    if (failedPRs.length) {
      const pr = failedPRs[0];
      core.info(`Rebasing ${pr.number}/"${pr.title}"`);
      await octokit.rest.issues.createComment({
        owner,
        repo,
        issue_number: pr.number,
        body: '@dependabot rebase',
      });
    }
  } catch (error) {
    console.trace(error);
    core.setFailed(error.message);
  }
}

run();
