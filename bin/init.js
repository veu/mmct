#!/usr/bin/env node

const config = require('../src/config');

async function initConfig() {
    await config.getToken();
    await config.getGracePeriod();
}

initConfig();
