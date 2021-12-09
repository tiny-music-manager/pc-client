import React from "react"
import { Switch, Route } from 'react-router-dom'
import { apis } from "../../api"
import { history } from "../../libs/consts"
import { dataset } from "../../libs/dataset"
import { installFontAll } from "../../libs/font-install"
import { DiscoverPage } from "../discover"
import { DLyric } from "../dlyric"
import { AlbumEditor } from "../editor/album/editor"
import { AlbumSelector } from "../editor/album/selector"
import { ArtistEditor } from "../editor/artist/editor"
import { ArtistSelector } from "../editor/artist/selector"
import { FontEditor } from "../editor/font/editor"
import { KindEditor } from "../editor/kind/editor"
import { KindSelector } from "../editor/kind/selector"
import { LyricEditor } from "../editor/lryic/editor"
import { LyricManager } from "../editor/lryic/manager"
import { MusicEditor } from "../editor/music/editor"
import { MusicScanner } from "../editor/music/scaner"
import { SystemInitialDialog } from "../editor/system/initial"
import { LoginDialog } from "../editor/user/login"
import { HomePage } from "./home"


interface IMainPageState {
	windowSize: 'normal' | 'max'
	showWindowMenu: boolean
	ready: boolean
}

export class MainPage extends React.Component<{}, IMainPageState> {

	private historyUnlisten!: () => void		//取消history监听

	async componentDidMount() {
		const pathname = window.location.pathname
		// const pathname = window.location.hash?.replace(/^#/, '') || ''

		//对话框
		if (pathname.match(/^\/dialog/)) {
			console.log('对话框')
		}
		//对话框
		else if (pathname.match(/^\/discover/)) {
			console.log('网络发现')
		}
		//桌面歌词
		else if (pathname.match(/^\/dlyric/)) {
			console.log('桌面歌词')
		}
		else {
			await this.initial()
			await installFontAll()
			this.historyUnlisten = history.listen(() => this.forceUpdate())
			await import('../../libs/player').then(res => res.player.onstatechange = () => this.forceUpdate())
			//歌词初始化，同时同步服务器歌词
			let lyricConfig = nativeApi.appdata.getLyricConfig()
			if (!lyricConfig) {
				const uconf = await apis.uconf.get({})
				nativeApi.appdata.setLyricConfig(uconf.lyric)
				lyricConfig = uconf.lyric
			}
			nativeApi.lyric.dlyricConfig('style', lyricConfig)
			nativeApi.appdata.onUpdate('config.lyric', () => nativeApi.lyric.dlyricConfig('style', nativeApi.appdata.getLyricConfig()))
			if (dataset.user) apis.uconf.set({ lyric: lyricConfig! }).catch(err => console.log(err))
			//完成
			this.setState({ ready: true })
		}
	}

	componentWillUnmount() {
		this.historyUnlisten?.()
	}

	private initialing = false
	private async initial() {
		this.initialing = true
		await new Promise(resolve => setTimeout(resolve, 100))
		while (true) {
			const res = await apis.sys.initial.list({})
			if (res) break
			alert('ffffffffffff  ' + window.location.href)
			await SystemInitialDialog.open({})
			break
		}
		let resolved = false
		return new Promise<void>(async (resolve, reject) => {
			//数据集处理
			dataset.on('love', () => this.forceUpdate())
			dataset.on('playlist', () => this.forceUpdate())
			dataset.on('user', async () => {
				dataset.love = await apis.love.base({}).catch(e => null)
				dataset.playlists = await apis.playlist.list({}).catch(e => null)
				if (!resolved) return resolve()
				resolved = true
				await this.forceUpdate()
			})
			dataset.user = await apis.user.self({}).catch(err => null)

			nativeApi.appdata.onUpdate('user-token', async () => {
				dataset.user = await apis.user.self({}).catch(err => null)
			})
		})
	}

	public render() {
		const { ready = false } = this.state ?? {}

		//对话框列表、
		const Dialogs = [
			ArtistEditor, ArtistSelector,
			AlbumEditor, AlbumSelector,
			KindEditor, KindSelector,
			MusicEditor, MusicScanner,
			LyricManager, LyricEditor,
			SystemInitialDialog,
			LoginDialog,
			FontEditor,
		]

		return (
			<Switch>
				{/* 桌面歌词 */}
				<Route path="/dlyric" component={DLyric} />
				{/* 网络发现 */}
				<Route path="/discover" component={DiscoverPage} />
				{/* 一些窗口工具 */}
				{Dialogs.map(Dialog => <Route key={Dialog.config.name} exact path={`/dialog/${Dialog.config.name}`} component={Dialog} />)}
				{/* 正常页面路由 */}
				{ready ? <Route path="/" component={HomePage} /> : null}
			</Switch>
		)
	}

}