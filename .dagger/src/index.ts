import { argument, dag, Directory, func, object } from "@dagger.io/dagger";
const NODE = "node:24.18.0-bookworm@sha256:4e9cb555d708e0829c9d93e5eeae9dfab0617b832ca436a690680e0fca735ef5";
const SEMGREP = "docker.io/semgrep/semgrep@sha256:6bd07d7b166b097e1384f41b94a62d8c8a26a4fff8713992c296e053310da01f";
@object()
export class InvestigationFixture {
  @func()
  async semgrep(@argument({ defaultPath: "/", ignore: [".git", ".devenv", "node_modules", ".dagger/sdk", ".dagger/node_modules"] }) source: Directory): Promise<string> {
    return dag.container().from(SEMGREP).withDirectory("/src", source).withWorkdir("/src")
      .withExec(["semgrep", "--test", ".semgrep", "--metrics=off"])
      .withExec(["semgrep", "scan", "--config", ".semgrep", "--exclude", ".semgrep", "--metrics=off", "--error"]).stdout();
  }
  @func()
  async alint(@argument({ defaultPath: "/", ignore: [".git", ".devenv", "node_modules", ".dagger/sdk", ".dagger/node_modules"] }) source: Directory): Promise<string> {
    return dag.container().from(NODE).withMountedCache("/root/.npm", dag.cacheVolume("investigation-fixture-npm"))
      .withExec(["npm", "install", "--global", "--no-audit", "--no-fund", "@asamarts/alint@0.15.0"])
      .withDirectory("/workspace", source).withWorkdir("/workspace")
      .withExec(["alint", "validate-config"]).withExec(["alint", "check", "--fail-on-warning", "--format", "github", "--no-docs"]).stdout();
  }
  @func()
  async lsLint(@argument({ defaultPath: "/", ignore: [".git", ".devenv", "node_modules", ".dagger/sdk", ".dagger/node_modules"] }) source: Directory): Promise<string> {
    return dag.container().from(NODE).withMountedCache("/root/.npm", dag.cacheVolume("investigation-fixture-npm"))
      .withExec(["npm", "install", "--global", "--no-audit", "--no-fund", "@ls-lint/ls-lint@2.3.1"])
      .withDirectory("/workspace", source).withWorkdir("/workspace")
      .withExec(["ls-lint", "--config", ".ls-lint.yml"]).stdout();
  }
  @func()
  async qualification(@argument({ defaultPath: "/", ignore: [".git", ".devenv", "node_modules", ".dagger/sdk", ".dagger/node_modules"] }) source: Directory): Promise<string> {
    await Promise.all([this.semgrep(source), this.alint(source), this.lsLint(source)]);
    return dag.container().from(NODE).withDirectory("/workspace", source).withWorkdir("/workspace")
      .withEnvVariable("NODE_ENV", "production")
      .withExec(["node", "--check", "server.mjs"])
      .withExec(["node", "--check", "inventory.mjs"])
      .withExec(["npm", "test"])
      .withExec(["node", ".dagger/smoke.mjs"]).stdout();
  }
}
