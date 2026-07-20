# site-www
Engage7 Labs Web Site

## Node.js

Local development and CI use Node.js 24 LTS. The reproducible declarations are
`package.json` `engines.node`, `.nvmrc`, `.node-version`, and the pinned
`actions/setup-node` workflow configuration. GitHub Action internal runtimes
are separate from the Node.js version used to execute this project.
