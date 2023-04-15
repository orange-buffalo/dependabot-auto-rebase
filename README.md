# Dependabot Auto Rebase

## Motivation

The motivation behind this GitHub Action is to address the issue described in dependabot/dependabot-core#2224,
where repositories that require branches to be up-to-date before merging make it harder to use Dependabot.

In such repositories, if Dependabot's pull requests are not up-to-date, automatic merging will not trigger. If
there are no conflicts with the target branch, Dependabot will not rebase the pull requests,
causing them to become stale.

This action provides a workaround to this issue by automatically requesting Dependabot
to rebase its stale pull requests upon pushing to the main branch,
ensuring that they stay up-to-date and can be merged seamlessly.

It is important to note that this action is only relevant until Dependabot resolves the issue.
Once Dependabot provides a fix, this action will no longer be necessary.

## Inputs

| Name         | Description                                                                                                                                                                             | Required |
|--------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|----------|
| `api-token`  | The API token used for authentication. This token must have permission to access the specified repository and *cannot be* default GH token. | Yes |
| `repository` | The name of the repository in the format `owner/repo`. This is the repository where Dependabot's pull requests will be checked and rebased. Typically, should be `${{ github.repository }}` | Yes      |

## Example usage

```yaml
name: Rebase Dependabot stale PRs

on:
  push:
    branches:
      - main
  workflow_dispatch:

jobs:
  rebase-dependabot:
    runs-on: ubuntu-latest
    steps:
      - name: "Rebase open Dependabot PR"
        uses: orange-buffalo/dependabot-auto-rebase@v1
        with:
          api-token: ${{ secrets.MY_PERSONAL_TOKEN }}
          repository: ${{ github.repository }}
```

It is recommended to disable Dependabot rebases by setting `rebase-strategy` to `disabled` in the
`.github/dependabot.yml` file:
```yaml
version: 2
updates:
  - ...
    rebase-strategy: "disabled"
```
With default rebase strategy, both this action and Dependabot will rebase PRs with conflicts, 
causing more noise and extra CI runs.

## Limitations

* This action only works with repositories that use Dependabot for dependency management.
* This action only rebases Dependabot's open pull requests that have auto-merge enabled.
* If multiple pull requests require rebasing due to failed checks, only the first one will be rebased.
