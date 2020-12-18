import {
  Project,
  Workspace,
  Descriptor,
  Plugin,
  Hooks,
  Package,
  Configuration,
} from "@yarnpkg/core";
import {join} from 'path';
import {readFileSync, writeFileSync} from 'fs';
import {BaseCommand} from '@yarnpkg/cli';
import {Command} from 'clipanion';
import {ppath} from '@yarnpkg/fslib'

class AutoFixCommand extends BaseCommand {
  @Command.Path('fix-package-extensions')
  async execute() {
    let packageExtensions = new Map();
    const pkgNames = new Set();
    const packages = new Map();
    const workspacesByName = new Map();
    const optionalPeers = new Set<string>();
    const configuration = await Configuration.find(this.context.cwd, this.context.plugins, {strict: false, useRc: true});
    const {project} = await Project.find(configuration, ppath.cwd());
    await project.restoreInstallState();
    project.workspaces.forEach(workspace => {
      const pkg = JSON.parse(readFileSync(join(workspace.cwd, 'package.json'), 'utf-8'));
      pkgNames.add(pkg.name);
      packages.set(workspace.cwd, pkg);
      workspacesByName.set(pkg.name, workspace.cwd);
      visit(workspace);
    });

    await Configuration.updateConfiguration(project.cwd, (config) => {
      const currentExtensions = config.packageExtensions || {};
      for (const [pkg, peers] of packageExtensions) {
        if (pkgNames.has(pkg)) {
          const meta = packages.get(workspacesByName.get(pkg));
          if (isUsedAsDependency(pkg)) {
            meta.peerDependencies = meta.peerDependencies || {};
            for (const peer of peers) {
              const peerVersion = findVersion(peer);
              if (!peerVersion) {
                optionalPeers.add(peer); 
                continue;
              }
              if (peer === pkg) {
                continue;
              }
              meta.peerDependencies[peer] = '*';
              meta.devDependencies = meta.devDependencies || {};
              meta.devDependencies[peer] = peerVersion;
            }
          } else {
            for (const peer of peers) {
              const peerVersion = findVersion(peer);
              if (!peerVersion) {
                optionalPeers.add(peer); 
                continue;
              }
              meta.dependencies = meta.dependencies || {};
              meta.dependencies[peer] = peerVersion;
            }
          }
        } else {
          const key = `${pkg}@*`;
          currentExtensions[key] = currentExtensions[key] || {};
          currentExtensions[key].peerDependencies = currentExtensions[key].peerDependencies || {};
          for (const peer of peers) {
            if (peer === pkg) {
              continue;
            }
            currentExtensions[key].peerDependencies[peer] = '*';
          }
        }
      }
      config.packageExtensions = currentExtensions; 
      return { ... config };
    });

    await Configuration.updateConfiguration(project.cwd, (config) => {
      const currentExtensions = config.packageExtensions || {};
      Object.keys(currentExtensions).forEach(extensionKey => {
        if (currentExtensions[extensionKey] && currentExtensions[extensionKey].peerDependencies) {
          for (const peer of optionalPeers) {
            delete currentExtensions[extensionKey].peerDependencies[peer];
          }
          if (Object.keys(currentExtensions[extensionKey].peerDependencies).length === 0) {
            delete currentExtensions[extensionKey].peerDependencies;
            if (Object.keys(currentExtensions[extensionKey]).length === 0) {
              delete currentExtensions[extensionKey];
            }
          }
        }
      });
      config.packageExtensions = currentExtensions; 
      return { ... config };
    });

    for (const [dir, pkg] of packages) {
      writeFileSync(join(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    }
    if (optionalPeers.size > 0) {
      const rootPkgPath = join(project.cwd, 'package.json');
      const rootPkg = JSON.parse(readFileSync(rootPkgPath, 'utf-8'));
      rootPkg.peerDependenciesMeta = rootPkg.peerDependenciesMeta || {};
      for (const peer of optionalPeers) {
        rootPkg.peerDependenciesMeta[peer] = rootPkg.peerDependenciesMeta[peer] || {};
        rootPkg.peerDependenciesMeta[peer].optional = true;
      }
      writeFileSync(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
    }

    function isUsedAsDependency(name) {
      if (findVersion(name)) {
        return true;
      }
      return false;
    }

    function findVersion(name) {
      for (const [dir, pkg] of packages) {
        if (pkg.dependencies && pkg.dependencies[name]) {
          return pkg.dependencies[name];
        }
        if (pkg.devDependencies && pkg.devDependencies[name]) {
          return pkg.devDependencies[name];
        }
      }
      return null;
    }

    function visit(workspace: Workspace) {
      const pkg = project.storedPackages.get(workspace.anchoredLocator.locatorHash);
      const deps = Array.from(workspace.dependencies.values()).map(descriptor => {
        return {
          descriptor,
          parent: pkg,
        }
      });
      let queue = deps;
      queue.forEach((item) => {
        const {descriptor, parent} = item;
        const pkg = project.storedPackages.get(project.storedResolutions.get(descriptor.descriptorHash));
        Array.from(pkg.dependencies.values()).forEach(descriptor => {
          queue.push({
            descriptor,
            parent: pkg,
          });
        })
      })

      for (let i = queue.length - 1; i >= 0; i--) {
        const {descriptor, parent} = queue[i];
        const pkg = project.storedPackages.get(project.storedResolutions.get(descriptor.descriptorHash));

        for (const [_, peerDescriptor] of pkg.peerDependencies) {
          const peerName = getPackageName(peerDescriptor);
          if (peerName.startsWith('@types/')) {
            continue;
          }
          if (Array.from(parent.dependencies.values()).some(descriptor => getPackageName(descriptor) === peerName)) {
            continue;
          } 
          if (Array.from(parent.peerDependencies.values()).some(descriptor => getPackageName(descriptor) === peerName)) {
            continue;
          }
          parent.peerDependencies.set(_, peerDescriptor);
          const parentName = getPackageName(parent);
          if (!packageExtensions.has(parentName)) {
            packageExtensions.set(parentName, new Set());
          }
          packageExtensions.get(parentName).add(peerName);
        }
      }
    }
  }
}

function getPackageName(descriptor: Descriptor | Package) {
  return typeof descriptor.scope === 'string' ? `@${descriptor.scope}/${descriptor.name}` : descriptor.name;
}

export default {
  commands: [
    AutoFixCommand
  ]
};
