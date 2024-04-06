import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'fs'
import { execa, type Options as ExecaOptions } from 'mygo/compiled/execa'
import chalk from 'mygo/compiled/chalk'
import { join } from 'path'
import { rimrafSync } from 'rimraf'
import { trim } from 'lodash'

interface IInitOpts {
  dest: string
}

export const init = async (opts: IInitOpts) => {
  const { dest } = opts

  if (!existsSync(dest)) {
    // mkdir
    mkdirSync(dest, { recursive: true })
  }

  const workDir = dest
  const cmd = createCMD(workDir)

  // is yarn project ?
  const lockFiles = ['pnpm-lock.yaml', 'package-lock.json', 'bun.lockb']
  const hasOtherLockFile = lockFiles.find((file) => {
    const absPath = join(dest, file)
    const isExist = existsSync(absPath)
    return isExist
  })
  if (hasOtherLockFile) {
    log(chalk.red('This package already uses other package manager.'))
    return
  }
  const hasYarnLockFile = existsSync(join(dest, 'yarn.lock'))
  if (!hasYarnLockFile) {
    // init
    await cmd(['yarn', 'init', '-y'])
  }
  // set berry
  await cmd(['yarn', 'set', 'version', 'berry'])
  // use yarn release version
  await cmd(['yarn', 'set', 'version', 'berry', '--yarn-path'])
  // set nodeLinker
  await cmd(['yarn', 'config', 'set', 'nodeLinker', 'node-modules'])
  // clear yarn config
  clearYarnConfig(dest)
  // add .gitignore
  addGitIgnore(dest)
  // rimraf node_modules
  const nodeModulesDir = join(dest, 'node_modules')
  if (existsSync(nodeModulesDir)) {
    rimrafSync(nodeModulesDir)
  }
  // install
  await cmd(['yarn', 'install'], { stdio: 'inherit' })
  // success
  log(chalk.green('init success 🎉'))
}

function log(...args: any[]) {
  // color refer: https://moegirl.uk/index.php?title=MyGO!!!!!&variant=zh
  const leftBrackets = chalk.bold.hex('#7777AA')('[')
  const rightBrackets = chalk.bold.hex('#7777AA')(']')
  const mChar = chalk.bold.hex('#77BBDD')('M')
  const yChar = chalk.bold.hex('#FF8899')('y')
  const gChar = chalk.bold.hex('#77DD77')('G')
  const oChar = chalk.bold.hex('#FFDD88')('O')
  const allChars = [
    leftBrackets,
    mChar,
    yChar,
    gChar,
    oChar,
    rightBrackets,
  ].join('')
  console.log(allChars, ...args)
}

function createCMD(workDir: string) {
  const cmd = async (commands: string[], opts?: ExecaOptions) => {
    const [command, ...args] = commands
    const options: ExecaOptions = opts
      ? { cwd: workDir, ...opts }
      : { cwd: workDir }
    if (process.env.DEBUG_MYGO) {
      console.log(chalk.gray(`$ ${command} ${args.join(' ')}`))
    }
    const result = await execa(command, args, options)
    return result
  }
  return cmd
}

function clearYarnConfig(dest: string) {
  const yarnrcPath = join(dest, '.yarnrc.yml')
  if (!existsSync(yarnrcPath)) {
    throw new Error('.yarnrc.yml not found')
  }
  const content = readFileSync(yarnrcPath, 'utf-8')
  const lines = content
    .split('\n')
    .map((line) => trim(line))
    .filter(Boolean)
  const newContent = lines.join('\n')
  // write
  writeFileSync(yarnrcPath, `${newContent}\n`, 'utf-8')
}

function addGitIgnore(dest: string) {
  const additions: string[] = [
    'node_modules',
    '.DS_Store',
    '.pnp.*',
    '.yarn/*',
    '!.yarn/patches',
    '!.yarn/plugins',
    '!.yarn/releases',
    '!.yarn/sdks',
    '!.yarn/versions',
  ]
  const gitignorePath = join(dest, '.gitignore')
  if (!existsSync(gitignorePath)) {
    const content = additions.join('\n')
    // write
    writeFileSync(gitignorePath, `${content}\n`, 'utf-8')
  } else {
    // append
    const content = readFileSync(gitignorePath, 'utf-8')
    const lines = content
      .split('\n')
      .map((line) => trim(line))
      .filter(Boolean)
    const needAdditions = additions.filter((addition) => {
      const isExist = lines.find((line) => line === addition)
      return !isExist
    })
    const newContent = [content, ...needAdditions].join('\n')
    // write
    writeFileSync(gitignorePath, `${newContent}\n`, 'utf-8')
  }
}
