#!/usr/bin/env node

require('../dist/index.js')
  .mygo()
  .catch((err) => {
    console.log(err)
  })
