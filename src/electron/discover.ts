import path from 'path'
import electron from 'electron'
import { wcd } from './wcd'
import { appdata } from './preload/lib/appdata'
import { serveWeb } from './static'

//网络发现
export async function discover() {
	//先检测本地的是否可用
	const conf = appdata.getNetworkAddress()
	if (conf && (conf.current || conf.addresses.length)) {
		const addresses = [...conf.addresses.filter(a => a != conf.current), conf.current].filter(s => !!s)
		if (addresses.length) {
			const { request } = await import('./preload/lib/request')
			for (let i = 0; i < addresses.length; ++i) {
				try {
					const pong = await request.get(`${addresses[i]}/api/sys/ping`, { type: 'json5', timeout: 3000 })
					if (pong == 'pong') {
						appdata.setNetworkAddress({ current: addresses[i], addresses: conf.addresses })
						return
					}
				} catch (err) {
				}
			}
		}
	}

	//本地没有或不可用时，进行网络发现
	return new Promise<void>((resolve) => {
		//创建窗口
		const win = new electron.BrowserWindow({
			width: 566, height: 200, frame: false, skipTaskbar: true, resizable: false, fullscreen: false, alwaysOnTop: true,
			webPreferences: {
				nodeIntegration: true,
				contextIsolation: true,
				webSecurity: false,
				scrollBounce: true,
				preload: path.join(electron.app.getAppPath(), 'preload.js'),
			}
		})
		//设置一些属性
		wcd.set(win, {
			windowId: win.id,
			env: { preload: 'discover' },
			creatorId: 0,
		})
		//加载URL
		win.setSkipTaskbar(true)
		win.loadURL(`${serveWeb.address}/discover`)
		// win.webContents.openDevTools()
		//监听发现结果
		electron.ipcMain.once('discover.done', (evt, addr) => {
			if (!addr) {
				electron.app.exit()
				return
			}
			win.close()
			resolve()
		})
	})
}