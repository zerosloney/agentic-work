#!/usr/bin/env node
'use strict';
// hooks/pre-execute.js — Runs before a loop-workflow agent or command executes

function onPreExecute(context) {
  const { logger, command } = context;
  logger.debug(`[loop-workflow] pre-execute: ${command.name || 'unknown'}`);
  return true;
}

module.exports = { onPreExecute };