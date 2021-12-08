import electron from 'electron'
import path from 'path'
import { dlyric } from './dlyric'
import type { TTrayConfigParam } from './preload/lib/tray'

//通知所有窗口托盘图标在干嘛
function post(event: string, args: Array<any>) {
	electron.webContents.getAllWebContents().forEach(wc => wc.send('tray.event', { name: event, args }))
}

export function createTray(win: electron.BrowserWindow) {
	let tray: electron.Tray | null = null
	let music = ''
	let method = ''

	const setTrayMenu = () => {
		if (!tray) {
			tray = new electron.Tray(path.join(electron.app.getAppPath(), 'res/logo/logo32.png'))
			tray.setToolTip('歌曲管理器')
			tray.on('double-click', () => win.show())
		}
		const menu = electron.Menu.buildFromTemplate([
			{ id: 'playing', label: `正在播放：${music ?? '无'}`, enabled: false },
			{ label: '显示主界面', type: 'normal', click: () => win.show() },
			{ label: '显示/隐藏桌面歌词', type: 'normal', click: () => dlyric.show(!dlyric.showing) },
			{ type: 'separator' },
			{ label: '上一曲', type: 'normal', click: () => post('control', ['prev']) },
			{ label: '下一曲', type: 'normal', click: () => post('control', ['next']) },
			{ label: '播放/暂停', type: 'normal', click: () => post('control', ['playpause']) },
			{
				id: 'method', label: '播放模式', submenu: [
					{ id: 'single', label: '单曲循环', type: 'radio', checked: method == 'single', click: () => post('method', ['single']) },
					{ id: 'list', label: '列表循环', type: 'radio', checked: method == 'list', click: () => post('method', ['list']) },
					{ id: 'random', label: '随机播放', type: 'radio', checked: method == 'random', click: () => post('method', ['random']) },
				]
			},
			{ type: 'separator' },
			{ label: '退出', type: 'normal', click: () => electron.app.quit() },
		])
		tray.setContextMenu(menu)
	}

	return {
		config(...[key, value]: TTrayConfigParam) {
			//设置播放方式
			if (key == 'method') {
				method = value
				setTrayMenu()
			}
			else if (key == 'music') {
				music = value
				setTrayMenu()
			}
		}
	}
}