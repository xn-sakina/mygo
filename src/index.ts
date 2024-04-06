import { program } from 'commander'
import { join, resolve } from 'path'
import { init } from './init'

interface IPkg {
  name: string
  version: string
  description: string
}

export const mygo = async () => {
  const pkg = require(join(__dirname, '../package.json')) as IPkg

  program
    .command('init [dir]')
    .description('Init a new yarn v4 project')
    .action(async (dir?: string) => {
      const cwd = process.cwd()
      const dest = dir?.length ? resolve(cwd, dir) : cwd
      await init({
        dest,
      })
    })

  program.name(pkg.name).description(pkg.description)
  program.version(pkg.version)
  program.parse(process.argv)
}
