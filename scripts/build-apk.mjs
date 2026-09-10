import { execFileSync } from 'node:child_process';
import { existsSync } from 'node:fs';

const run = (command, args, options = {}) => execFileSync(command, args, { stdio: 'inherit', ...options });
run('pnpm', ['check']);
run('pnpm', ['build']);
if (!existsSync('android')) run('pnpm', ['exec', 'cap', 'add', 'android']);
run('pnpm', ['exec', 'cap', 'sync', 'android']);
run('pnpm', ['exec', 'cap', 'copy', 'android']);
const gradle = process.platform === 'win32' ? 'gradlew.bat' : './gradlew';
run(gradle, ['assembleDebug'], { cwd: 'android', env: { ...process.env, JAVA_HOME: process.env.JAVA_HOME ?? '/usr/lib/jvm/java-17-openjdk-amd64' } });
console.log('APK criado em android/app/build/outputs/apk/debug/app-debug.apk');
