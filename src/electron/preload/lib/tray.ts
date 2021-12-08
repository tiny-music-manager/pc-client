import electron from 'electron'

const trayEvents: { [k: string]: Array<(...args: Array<any>) => any> } = {}


export type TTrayConfigParam = [key: 'method', value: 'single' | 'list' | 'random']
	| [key: 'music', value: string]


export type TTrayOnParam = [event: 'control', callback: (name: 'prev' | 'next' | 'playpause') => any]
	| [event: 'method', callback: (name: 'single' | 'list' | 'random') => any]


//监听主进程发来的事件
electron.ipcRenderer.on('tray.event', (evt, data) => {
	if (!trayEvents[data.name]) return
	trayEvents[data.name].forEach(func => func(...data.args))
})

export const tray = {
	//配置tray
	config(...[key, value]: TTrayConfigParam) {
		electron.ipcRenderer.sendSync('tray.config', { key, value })
	},
	//事件监听
	on(...[event, callback]: TTrayOnParam) {
		if (!trayEvents[event]) trayEvents[event] = []
		trayEvents[event].push(callback)
	}

}