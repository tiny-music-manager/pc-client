
if (false) {
	const path = require('path')
	const fs = require('fs')

	//检测是不是开发模式
	if (fs.existsSync(path.join(__dirname, 'src'))) {
		require('ts-node').register({
			project: path.join(__dirname, 'tsconfig.json'),
			files: true,
		})
		require('./src/electron/main.ts')
	}
	else require('./dist/electron/main.js')
}
else {
	require('./lib/main.js')
}
