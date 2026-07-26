#!/usr/bin/env node
'use strict';
// hooks/uninstall.js — Runs before loop-workflow is removed

function onUninstall(context) {
  const { logger } = context;
  logger.info('[loop-workflow] uninstalling: cleaning up registered agents and commands');
  return true;
}

module.exports = { onUninstall };