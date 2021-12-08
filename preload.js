
if (false) {
	const fs = require('fs')
	const path = require('path')

	//检测是不是开发模式
	if (fs.existsSync(path.join(__dirname, 'src'))) {
		require('ts-node').register({
			project: path.join(__dirname, 'tsconfig.json'),
			files: true,
		})
		require('./src/electron/preload/index.ts')
	}
	else require('./dist/electron/preload/index.js')
}
else {
	require('./lib/preload/index.js')
}
