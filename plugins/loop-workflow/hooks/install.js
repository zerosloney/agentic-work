#!/usr/bin/env node
'use strict';
// hooks/install.js — Runs after loop-workflow is installed

function onInstall(context) {
  const { logger } = context;
  logger.info('[loop-workflow] installed: 6 agents + 3 commands ready');
  return true;
}

module.exports = { onInstall };