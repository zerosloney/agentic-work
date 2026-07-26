#!/usr/bin/env node
'use strict';
// hooks/post-execute.js — Runs after a loop-workflow agent or command executes

function onPostExecute(context) {
  const { logger, command, result } = context;
  logger.debug(`[loop-workflow] post-execute: ${command.name || 'unknown'} → ${result?.status || 'unknown'}`);
  return true;
}

module.exports = { onPostExecute };