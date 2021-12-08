import type { request } from '../../electron/preload/lib/request'
import type { appdata } from '../../electron/preload/lib/appdata'
import type { tray } from '../../electron/preload/lib/tray'
import type { LyricParser, TLyricType } from '../../electron/lyric'
import type { IUploadInfo } from '../../pages/manage/upload'
import { IUConfig } from '../datatype'

declare global {

	interface IWindowEnv {
		[i: string]: any
		loadScript?: string
		hideAlways?: boolean
	}

	interface ICreateWindowResult {
		openFile: (filename: string) => void,
		openURL: (url: string) => void,
		close: () => void,
		onExit: (cb: (data: any) => any) => void,
		onClose: (cb: () => any) => void,
	}

	interface IPathApi {
		basename(path: string, ext?: string): string
		dirname(path: string): string
		extname(path: string): string
		join(...items: Array<string>): string
		resolve(...items: Array<string>): string
		isAbsolute(path: string): boolean
	}

	interface IFSApi {
		isdir(pathname: string): boolean
		readdir(dirname: string): Array<string>
		readfile(pathname: string): Uint8Array
		writefile(pathname: string, data: string | Buffer): void
		exists(pathname: string): boolean
	}

	export interface ISystemApi {
		readonly configdir: string
		readonly homedir: string
	}

	export interface IAudioApi {
		duration(file: string): Promise<number>
		bitrate(file: string): Promise<number>
	}

	export interface ILyricApi {
		//转换第三方歌词
		fromBase64(type: TLyricType, content: string): any
		//转换歌词
		parseLyric(lyric: string): { ti: string, ar: string, al: string, body: Array<[number, string | Array<[number, string]>]> }
		//桌面歌词配置
		dlyricConfig(type: 'lyric', data: Array<[number, string | Array<[number, string]>]>): void
		dlyricConfig(type: 'time', data: number): void
		dlyricConfig(type: 'style', data: any): void
		dlyricConfig(type: 'fonts', data: Array<{ id: string, url: string }>): void
		//显示、隐藏
		show(show: boolean): void
		//是否显示
		isShowing(): boolean
	}

	export const nativeApi: {
		appdata: typeof appdata
		lyric: ILyricApi,
		path: IPathApi
		fs: IFSApi
		audio: IAudioApi
		system: ISystemApi
		env: IWindowEnv
		window: {
			createWindow: (option: Electron.BrowserWindowConstructorOptions & { env?: IWindowEnv }) => ICreateWindowResult
			exitWindow: (data: any) => any
			closeWindow: (data?: any) => any
			getState(): { maximized: boolean, minimized: boolean, fullscreen: boolean, normal: boolean } | null
			fullscreen(fullscreen: boolean): void
			maximize(maximized: boolean): void
			minimize(): void
			show(show: boolean): void
		}
		request: typeof request
		tray: typeof tray
		webUrl: string
	}

}