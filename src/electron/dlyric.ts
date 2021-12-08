import path from 'path'
import os from 'os'
import electron from 'electron'
import { wcd } from './wcd'
import { serveWeb } from './static'

const dev = false

export let dlyric: ReturnType<typeof createDesktopLyric>

export function createDesktopLyric() {
	const screenSize = electron.screen.getPrimaryDisplay().size

	const width = Math.min(1000, screenSize.width)
	const height = Math.min(150, screenSize.height)

	const win = new electron.BrowserWindow({
		x: (screenSize.width - width) / 2,
		y: (screenSize.height - height) - 80,
		width: width,
		height: height,
		show: false,
		frame: false,
		skipTaskbar: true,
		transparent: true,
		alwaysOnTop: true,
		resizable: false,
		fullscreen: false,
		focusable: (os.platform() == 'linux') ? true : false,
		icon: path.join(electron.app.getAppPath(), 'res/logo/logo-lyric.png'),
		webPreferences: {
			nodeIntegration: true,
			contextIsolation: true,
			webSecurity: false,
			scrollBounce: true,
			preload: path.join(electron.app.getAppPath(), 'preload.js'),
		},
	})
	wcd.set(win, {
		windowId: win.id,
		env: { preload: 'dlyric' },
		creatorId: 0,
	})
	win.setSkipTaskbar(true)
	win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
	if (!dev) win.setIgnoreMouseEvents(true, { forward: true })
	win.loadURL(`${serveWeb.address}/dlyric`)
	if (dev) win.webContents.openDevTools()

	function post(type: string, data: any) {
		win.webContents.postMessage('dlyric.config', { type, data })
	}

	const res = {
		//设置歌词
		set lyric(lines: Array<[number, string | Array<[number, string]>]>) {
			post('lyric', lines)
		},
		//设置播放时间
		set time(time: number) {
			post('time', time)
		},
		//样式更新
		set style(style: any) {
			post('style', style)
		},
		//配置歌词
		config(type: string, data: any) {
			post(type, data)
		},
		//设置是否显示
		show(show: boolean) {
			if (show) {
				win.show()
				win.setAlwaysOnTop(true)
				win.setVisibleOnAllWorkspaces(true, { visibleOnFullScreen: true })
			}
			else {
				win.hide()
			}
		},
		//忽略鼠标事件
		ignoreMouseEvent(ignore: boolean) {
			if (dev) return
			if (ignore) {
				win.setIgnoreMouseEvents(true, { forward: true })
				win.setFocusable(true)
			}
			else {
				win.setIgnoreMouseEvents(false)
				win.setFocusable(true)
			}
		},
		/** 是否处于显示状态 */
		get showing() {
			return win.isVisible()
		},
	}

	//完成
	dlyric = res
	return res
}