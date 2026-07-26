#!/usr/bin/env node
'use strict';
// hooks/index.js — loop-workflow lifecycle hooks
//
// Exports register(context) called by the platform during
// plugin install / uninstall / pre-execute / post-execute.

const install = require('./install');
const uninstall = require('./uninstall');
const preExecute = require('./pre-execute');
const postExecute = require('./post-execute');

function register(context) {
  const { logger, platform } = context;
  logger.info('[loop-workflow] hooks: registering lifecycle handlers');
  platform.on('install', install.onInstall);
  platform.on('uninstall', uninstall.onUninstall);
  platform.on('pre-execute', preExecute.onPreExecute);
  platform.on('post-execute', postExecute.onPostExecute);
  return true;
}

module.exports = { register };