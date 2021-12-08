import electron from 'electron'

const env = electron.ipcRenderer.sendSync('window.env')
const preload = env?.preload ?? 'main'

switch (preload) {
	case 'main':
		require('./main')
		break
	case 'dlyric':
		require('./dlyric')
		break
	case 'discover':
		require('./discover')
		break
}