/* eslint-disable */
module.exports = {
name: "@yarnpkg/plugin-autofix-package-extensions",
factory: function (require) {
var plugin;plugin =
/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ([
/* 0 */
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => __WEBPACK_DEFAULT_EXPORT__
/* harmony export */ });
/* harmony import */ var _yarnpkg_core__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(1);
/* harmony import */ var _yarnpkg_core__WEBPACK_IMPORTED_MODULE_0___default = /*#__PURE__*/__webpack_require__.n(_yarnpkg_core__WEBPACK_IMPORTED_MODULE_0__);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(2);
/* harmony import */ var path__WEBPACK_IMPORTED_MODULE_1___default = /*#__PURE__*/__webpack_require__.n(path__WEBPACK_IMPORTED_MODULE_1__);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_2__ = __webpack_require__(3);
/* harmony import */ var fs__WEBPACK_IMPORTED_MODULE_2___default = /*#__PURE__*/__webpack_require__.n(fs__WEBPACK_IMPORTED_MODULE_2__);
/* harmony import */ var _yarnpkg_cli__WEBPACK_IMPORTED_MODULE_3__ = __webpack_require__(4);
/* harmony import */ var _yarnpkg_cli__WEBPACK_IMPORTED_MODULE_3___default = /*#__PURE__*/__webpack_require__.n(_yarnpkg_cli__WEBPACK_IMPORTED_MODULE_3__);
/* harmony import */ var clipanion__WEBPACK_IMPORTED_MODULE_4__ = __webpack_require__(5);
/* harmony import */ var clipanion__WEBPACK_IMPORTED_MODULE_4___default = /*#__PURE__*/__webpack_require__.n(clipanion__WEBPACK_IMPORTED_MODULE_4__);
/* harmony import */ var _yarnpkg_fslib__WEBPACK_IMPORTED_MODULE_5__ = __webpack_require__(6);
/* harmony import */ var _yarnpkg_fslib__WEBPACK_IMPORTED_MODULE_5___default = /*#__PURE__*/__webpack_require__.n(_yarnpkg_fslib__WEBPACK_IMPORTED_MODULE_5__);
var __decorate = undefined && undefined.__decorate || function (decorators, target, key, desc) {
  var c = arguments.length,
      r = c < 3 ? target : desc === null ? desc = Object.getOwnPropertyDescriptor(target, key) : desc,
      d;
  if (typeof Reflect === "object" && typeof Reflect.decorate === "function") r = Reflect.decorate(decorators, target, key, desc);else for (var i = decorators.length - 1; i >= 0; i--) if (d = decorators[i]) r = (c < 3 ? d(r) : c > 3 ? d(target, key, r) : d(target, key)) || r;
  return c > 3 && r && Object.defineProperty(target, key, r), r;
};








class AutoFixCommand extends _yarnpkg_cli__WEBPACK_IMPORTED_MODULE_3__.BaseCommand {
  async execute() {
    let packageExtensions = new Map();
    const pkgNames = new Set();
    const packages = new Map();
    const workspacesByName = new Map();
    const optionalPeers = new Set();
    const configuration = await _yarnpkg_core__WEBPACK_IMPORTED_MODULE_0__.Configuration.find(this.context.cwd, this.context.plugins, {
      strict: false,
      useRc: true
    });
    const {
      project
    } = await _yarnpkg_core__WEBPACK_IMPORTED_MODULE_0__.Project.find(configuration, _yarnpkg_fslib__WEBPACK_IMPORTED_MODULE_5__.ppath.cwd());
    await project.restoreInstallState();
    project.workspaces.forEach(workspace => {
      const pkg = JSON.parse((0,fs__WEBPACK_IMPORTED_MODULE_2__.readFileSync)((0,path__WEBPACK_IMPORTED_MODULE_1__.join)(workspace.cwd, 'package.json'), 'utf-8'));
      pkgNames.add(pkg.name);
      packages.set(workspace.cwd, pkg);
      workspacesByName.set(pkg.name, workspace.cwd);
      visit(workspace);
    });
    await _yarnpkg_core__WEBPACK_IMPORTED_MODULE_0__.Configuration.updateConfiguration(project.cwd, config => {
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
      return { ...config
      };
    });
    await _yarnpkg_core__WEBPACK_IMPORTED_MODULE_0__.Configuration.updateConfiguration(project.cwd, config => {
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
      return { ...config
      };
    });

    for (const [dir, pkg] of packages) {
      (0,fs__WEBPACK_IMPORTED_MODULE_2__.writeFileSync)((0,path__WEBPACK_IMPORTED_MODULE_1__.join)(dir, 'package.json'), JSON.stringify(pkg, null, 2) + '\n');
    }

    if (optionalPeers.size > 0) {
      const rootPkgPath = (0,path__WEBPACK_IMPORTED_MODULE_1__.join)(project.cwd, 'package.json');
      const rootPkg = JSON.parse((0,fs__WEBPACK_IMPORTED_MODULE_2__.readFileSync)(rootPkgPath, 'utf-8'));
      rootPkg.peerDependenciesMeta = rootPkg.peerDependenciesMeta || {};

      for (const peer of optionalPeers) {
        rootPkg.peerDependenciesMeta[peer] = rootPkg.peerDependenciesMeta[peer] || {};
        rootPkg.peerDependenciesMeta[peer].optional = true;
      }

      (0,fs__WEBPACK_IMPORTED_MODULE_2__.writeFileSync)(rootPkgPath, JSON.stringify(rootPkg, null, 2) + '\n');
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

    function visit(workspace) {
      const pkg = project.storedPackages.get(workspace.anchoredLocator.locatorHash);
      const deps = Array.from(workspace.dependencies.values()).map(descriptor => {
        return {
          descriptor,
          parent: pkg
        };
      });
      let queue = deps;
      queue.forEach(item => {
        const {
          descriptor,
          parent
        } = item;
        const pkg = project.storedPackages.get(project.storedResolutions.get(descriptor.descriptorHash));
        Array.from(pkg.dependencies.values()).forEach(descriptor => {
          queue.push({
            descriptor,
            parent: pkg
          });
        });
      });

      for (let i = queue.length - 1; i >= 0; i--) {
        const {
          descriptor,
          parent
        } = queue[i];
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

__decorate([clipanion__WEBPACK_IMPORTED_MODULE_4__.Command.Path('fix-package-extensions')], AutoFixCommand.prototype, "execute", null);

function getPackageName(descriptor) {
  return typeof descriptor.scope === 'string' ? `@${descriptor.scope}/${descriptor.name}` : descriptor.name;
}

/* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = ({
  commands: [AutoFixCommand]
});

/***/ }),
/* 1 */
/***/ ((module) => {

module.exports = require("@yarnpkg/core");;

/***/ }),
/* 2 */
/***/ ((module) => {

module.exports = require("path");;

/***/ }),
/* 3 */
/***/ ((module) => {

module.exports = require("fs");;

/***/ }),
/* 4 */
/***/ ((module) => {

module.exports = require("@yarnpkg/cli");;

/***/ }),
/* 5 */
/***/ ((module) => {

module.exports = require("clipanion");;

/***/ }),
/* 6 */
/***/ ((module) => {

module.exports = require("@yarnpkg/fslib");;

/***/ })
/******/ 	]);
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		if(__webpack_module_cache__[moduleId]) {
/******/ 			return __webpack_module_cache__[moduleId].exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat get default export */
/******/ 	(() => {
/******/ 		// getDefaultExport function for compatibility with non-harmony modules
/******/ 		__webpack_require__.n = (module) => {
/******/ 			var getter = module && module.__esModule ?
/******/ 				() => module['default'] :
/******/ 				() => module;
/******/ 			__webpack_require__.d(getter, { a: getter });
/******/ 			return getter;
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => Object.prototype.hasOwnProperty.call(obj, prop)
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
/******/ 	// module exports must be returned from runtime so entry inlining is disabled
/******/ 	// startup
/******/ 	// Load entry module and return exports
/******/ 	return __webpack_require__(0);
/******/ })()
;
return plugin;
}
};