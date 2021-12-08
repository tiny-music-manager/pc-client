import electron from 'electron'

let dlyricCallback: (type: string, data: any) => any

electron.ipcRenderer.on('dlyric.config', (evt, data) => {
	dlyricCallback?.(data.type, data.data)
})


const dlyricApi = {
	onConfig(callback: typeof dlyricCallback) {
		dlyricCallback = callback
	},
	ignoreMouseEvent(ignore: boolean) {
		electron.ipcRenderer.sendSync('dlyric.ignoreMouse', ignore)
	},
	points() {
		return electron.ipcRenderer.sendSync('points')
	}
}

electron.contextBridge.exposeInMainWorld('dlyric', dlyricApi)