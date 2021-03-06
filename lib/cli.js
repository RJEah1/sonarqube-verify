#!/usr/bin/env node
"use strict";

// Provide a title to the process in `ps`.
// Due to an obscure Mac bug, do not start this title with any symbol.
process.title = "sonarqube-verify";

const verifier = require("../lib/sonarqube-verify.js");
const debug = require("debug")("tests");
const fs = require("fs");
const propertiesReader = require("properties-reader");

const sonarPropertiesFilePath = process.cwd() + "/sonar-project.properties";
var customizedProjectKey = "";
var customizedProjectName = "";

// get sonar.projectKey and sonar.projectName from sonar-project.properties file if it exists
try {
  fs.statSync(sonarPropertiesFilePath);
  const sonarProperties = propertiesReader(sonarPropertiesFilePath);
  customizedProjectKey = sonarProperties.get("sonar.projectKey");
  customizedProjectName = sonarProperties.get("sonar.projectName");
  console.log("Customized sonar-project.properties file found");
} catch (err) {
  if (err.code === "ENOENT") {
    console.log(
      "No customized sonar-project.properties file has been found. Taking project key and project name from package.json/name"
    );
  }
}

// treat cases of scoped packages, i.e. @scope/name
const pkg = require(process.cwd() + "/package.json");
const defaultProjectKey = pkg.name.replace("@", "").replace("/", ":");

const projectKey = customizedProjectKey || defaultProjectKey;
const projectName = customizedProjectName || pkg.name;

console.log("sonar.projectKey = " + projectKey);
console.log("sonar.projectName = " + projectName);

// sonar parameters
const sonarUrl = process.env.SONAR_URL || "http://localhost:9000";
const sonarLogin = process.env.SONAR_LOGIN || "";
const sonarPassword = process.env.SONAR_PASSWORD || "";
const sonarSkip = process.env.SONAR_SKIP || false;
const gateSkip = process.env.SONAR_GATE_SKIP || false;

const params = {
  "sonar.projectKey": projectKey,
  "sonar.projectVersion": pkg.version,
  "sonar.projectName": projectName,
  "sonar.host.url": sonarUrl,
  "sonar.login": sonarLogin,
  "sonar.skip": sonarSkip,
  "sonar.gate.skip": gateSkip,
  "sonar.password": sonarPassword,
};

verifier
  .verify(params)
  .then((result) => {
    console.log("Verification ended in success");
    console.log(result);
    process.exit(0);
  })
  .catch((err) => {
    console.log("Verification ended in error");
    console.error(err);
    if (err.stack) {
      debug(err.stack);
    }
    process.exit(1);
  });
