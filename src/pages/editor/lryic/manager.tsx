import './manager.scss'
import { AppbarButtons } from "../../../components/appbar/btns"
import { Dialog } from "../../../libs/dialog"
import { CheckBox } from '../../../components/checkbox'
import { ILyric, IMusic } from '../../../libs/datatype'
import { apis } from '../../../api'
import { Loading } from '../../../components/loading'
import { util } from '../../../libs/util'
import { createDialog } from '../../../components/popover'
import { LyricEditor } from './editor'

interface ISearchLyricInfo {
	id: string
	accesskey: string
	singer: string
	song: string
	othername: string
	albumname: string
	duration: number
}


interface ILyricManagerState {
	inited: boolean				//是否初始化完成
	currentPage: string

	music: IMusic
	lyrics: Array<ILyric>
	selected: string

	webSearchKeyword: string
	webSearching: boolean
	webSearchResult: Array<ISearchLyricInfo> | null
	webSearchSelecte: { [i: string]: boolean }
	webSearchDownloading: { [i: string]: boolean }
	webSearchDownloaded: Array<string>
	webSearchSaving: boolean		//是否正在保存
}

interface ILyricManagerData {
	//歌曲ID
	music: string
}

interface ILyricManagerResult {
}

export class LyricManager extends Dialog<ILyricManagerData, ILyricManagerResult, {}, ILyricManagerState> {
	public static config = { name: 'lyric-manager', width: 800, height: 530 }

	constructor(props: any) {
		super(props)
		this.state = {
			inited: false,
			currentPage: 'main',

			music: null!,
			lyrics: [],
			selected: '',

			webSearchKeyword: '',
			webSearching: false,
			webSearchResult: null,
			webSearchSelecte: {},
			webSearchDownloading: {},
			webSearchDownloaded: [],
			webSearchSaving: false,
		}
	}

	async componentDidMount() {
		//歌曲信息
		const music = await apis.music.info({ id: this.data.music })
		if (!music) return
		//歌词列表
		const lyrics = await apis.lyric.list({ music: music.id })
		//已下载
		const webSearchDownloaded = lyrics.map((l: any) => l.oid).filter((l: any) => !!l)

		//初始化完成
		this.setState({ inited: true, music, lyrics, webSearchKeyword: music.name, webSearchDownloaded })
	}

	//网络搜索
	private async handleSearchWeb() {
		const { webSearchKeyword, music, webSearching } = this.state
		if (!webSearchKeyword || !music || webSearching) return
		//状态处理
		this.setState({ webSearching: true, webSearchResult: null })

		//搜索歌曲
		const res: any = await nativeApi.request.get(`http://mobilecdn.kugou.com/api/v3/search/song`, { params: { keyword: webSearchKeyword, page: 1, pageSize: 50 }, type: 'json' })
		const songs: Array<any> = (res?.data?.info ?? [])
			.filter((s: any) => Math.abs(music.duration - s.duration) < 10)			//时间范围不能太大
			.filter((s: any) => music.artists.some(a => (a.name.indexOf(s.singername) >= 0) || (s.singername.indexOf(a.name) >= 0)))		//包含歌手

		//搜索歌词
		const searchResult: Array<ISearchLyricInfo> = []
		for (let i = 0; i < songs.length; ++i) {
			const hash = songs[i].hash
			const res = await nativeApi.request.get(`http://krcs.kugou.com/search`, { params: { ver: 1, man: 'yes', duration: music.duration * 1000, hash, pageSize: 50 }, type: 'json' })
			res?.candidates?.forEach?.((di: any) => {
				if (Math.abs(di.duration / 1000 - music.duration) > 10) return
				searchResult.push({
					id: `kugou_${di.id}`,
					accesskey: di.accesskey,
					singer: di.singer, song: di.song,
					duration: di.duration,
					othername: songs[i].othername_original ?? '',
					albumname: songs[i].album_name ?? '',
				})
			})
		}

		//过滤重复的
		let result: Array<ISearchLyricInfo> = []
		searchResult.forEach(item => {
			if (!result.some(ri => ri.id == item.id)) result.push(item)
		})

		//排序一下
		const duration = music.duration * 1000
		result = result.sort((a, b) => Math.abs(a.duration - duration) - Math.abs(b.duration - duration))

		//完成
		this.setState({ webSearching: false, webSearchResult: result })
	}

	//下载歌词
	private async handleDownloadLyric() {
		const { music, webSearchDownloading, webSearchResult = null, webSearchSelecte } = this.state
		if (!webSearchResult) return
		if (!music) return
		const lyrics = webSearchResult.filter(item => webSearchSelecte[item.id])
		if (!lyrics.length) return

		//下载歌词
		const download = async (lyric: ISearchLyricInfo) => {
			const res = await nativeApi.request.get(`http://lyrics.kugou.com/download`, {
				type: 'json', params: {
					ver: 1, client: 'pc',
					id: lyric.id.replace(/^kugou_/, ''), accesskey: lyric.accesskey,
					fmt: 'krc', charset: 'utf8',
				}
			})
			if (!res?.content) return null

			const txt = nativeApi.lyric.fromBase64('krc', res.content)
			return txt
		}
		//上传至服务器
		const upload = async (lyric: ISearchLyricInfo, content: string) => {
			type TSaveParams = Parameters<typeof apis.lyric.save>[0]
			const data: TSaveParams = {
				music: music.id,
				name: lyric.song, artist: lyric.singer, album: lyric.albumname,
				duration: lyric.duration, oid: lyric.id,
				body: [],
			}
			const info = JSON.parse(content)
			if (info.ar) data.artist = info.ar
			if (info.ti) data.name = info.ti
			info.lines.forEach((line: any) => {
				//歌词逐字处理
				const words: Array<[number, string]> = []
				line.words.forEach(({ time, word }: any) => {
					const last = words[words.length - 1]
					//时间为0？？？，合并吧
					if (time <= 0) {
						//有的话直接拼接
						if (last) last[1] += word
						//否则追加
						else words.push([0, word])
					}
					//正常情况
					else {
						//之前有没有时间为0的，有的话拼接上去
						if (last && last[0] <= 0) {
							last[0] = time
							last[1] += word
						}
						//正常处理
						words.push([time, word])
					}
				})
				//把当前处理好的行信息加入到body
				data.body.push([line.start, words])
			})
			//上传
			await apis.lyric.save(data)
		}

		//逐个处理
		this.setState({ webSearchSaving: true })
		for (let i = 0; i < lyrics.length; ++i) {
			try {
				const lyric = lyrics[i]
				await this.setState({ webSearchDownloading: { ...webSearchDownloading, [lyric.id]: true } })
				const lyricText = await download(lyric)
				if (lyricText) {
					await upload(lyric, lyricText)
					await this.setState({
						webSearchSelecte: { ...this.state.webSearchSelecte, [lyric.id]: false },
						webSearchDownloading: { ...webSearchDownloading, [lyric.id]: false },
						webSearchDownloaded: [...this.state.webSearchDownloaded, lyric.id],
					})
				}
				else {
					await this.setState({
						webSearchSelecte: { ...this.state.webSearchSelecte, [lyric.id]: false },
						webSearchDownloading: { ...webSearchDownloading, [lyric.id]: false },
					})
				}
			} catch (err) { }
		}

		//刷新一下歌词
		this.setState({ webSearchSaving: false, lyrics: await apis.lyric.list({ music: this.state.music.id }) })
	}

	//编辑歌词，没有lyric参数则表示制作歌词
	private async handleEditLyric(lyric?: ILyric) {
		if (!await LyricEditor.open({ lyric, music: this.state.music.id })) return
		//重新搜索歌词
		this.setState({ lyrics: await apis.lyric.list({ music: this.state.music.id }) })
	}

	//删除歌词
	private async handleRemoveLyric() {
		const lyric = this.current
		if (!lyric) return
		if (!await createDialog('删除歌词', `是否删除歌词《${lyric.name}》?`).wait()) return

		await apis.lyric.remove({ id: lyric.id })
		this.setState({ lyrics: this.state.lyrics.filter(l => l.id != lyric.id) })
	}

	//设为默认歌词
	private async handleSetDefault() {
		const lyric = this.current
		if (!lyric || lyric.default) return

		if (!await createDialog('默认歌词', `是否设置《${lyric.name}》为默认歌词？`).wait()) return

		//修改
		await apis.lyric.default({ id: lyric.id })

		//更新本地数据
		this.state.lyrics.forEach(l => l.default = l.id == lyric.id)
		this.forceUpdate()
	}

	//当前选择的歌词
	private get current(): ILyric | null {
		return this.state.lyrics.filter(l => l.id == this.state.selected)?.[0] ?? null
	}

	render() {
		const {
			inited = false, currentPage,
			lyrics: _lyrics, selected,
			webSearching = false, webSearchKeyword = '', webSearchResult = null, webSearchSelecte, webSearchDownloading, webSearchDownloaded, webSearchSaving,
		} = this.state

		const webSearchAllSelecte = webSearchResult?.every(i => webSearchDownloaded.includes(i.id) || webSearchSelecte[i.id]) ?? false
		const webSearchSelecteSome = Object.keys(webSearchSelecte).some(key => webSearchSelecte[key])

		const lyrics = _lyrics.sort((a, b) => {
			if (a.default == b.default) return a.duration - b.duration
			if (a.default > b.default) return -1
			return 1
		})

		return (
			<div className="app-window" id="lyric-manager">
				<div className="appbar">
					<div className="title">歌词管理</div>
					<AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				{inited ?
					<div className="appbody">
						{/* 主界面 */}
						<div className={`${currentPage == 'main' ? 'show' : ''}`}>
							<div className="btn-area">
								<div className="button" onClick={() => this.setState({ currentPage: 'websearch' })}>搜索网络歌词</div>
								<div className="button" onClick={() => this.handleEditLyric()}>制作歌词</div>
								<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => {
									const lyric = lyrics.filter(lyric => lyric.id == selected)[0]
									if (lyric) this.handleEditLyric(lyric)
								}}>编辑歌词</div>
								<div className={`button ${(selected && !this.current?.default) ? '' : 'disabled'}`} onClick={() => this.handleSetDefault()}>设为默认</div>
								<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => this.handleRemoveLyric()}>删除歌词</div>
							</div>
							<div className="lyric-list">
								<div className="lyric-line title">
									<div className="check"></div>
									<div className="name">名称</div>
									<div className="artist">歌手</div>
									<div className="duration">时长</div>
									<div className="type">标注</div>
									<div className="content">歌词</div>
								</div>
								<div className="lyric-content">
									{lyrics.map(lyric => <div className="lyric-line" key={lyric.id} onClick={() => this.setState({ selected: selected == lyric.id ? '' : lyric.id })} >
										<div className="check">
											<CheckBox checked={selected == lyric.id} />
										</div>
										<div className="name">{lyric.name}</div>
										<div className="artist">{lyric.artist}</div>
										<div className="duration">{util.durationStr(lyric.duration / 1000)}</div>
										<div className="type">
											{lyric.type == 'karaoke' ? <div className="tag">卡拉OK</div> : null}
											{lyric.default ? <div className="tag">默认</div> : null}
										</div>
										<div className="content" title={lyric.text}>{lyric.text}</div>
									</div>)}
								</div>
							</div>
						</div>
						{/* 网络歌词 */}
						<div className={`${currentPage == 'websearch' ? 'show' : ''}`}>
							<div className="btn-area">
								<input type="text" className="input" value={webSearchKeyword} onChange={e => this.setState({ webSearchKeyword: e.target.value })} />
								<div className={`button ${webSearchKeyword.trim() ? '' : 'disabled'}`} onClick={this.handleSearchWeb.bind(this)}>搜索</div>
								<div className={`button ${webSearchSelecteSome && !webSearchSaving ? '' : 'disabled'}`} onClick={this.handleDownloadLyric.bind(this)}>添加到歌词库</div>
								<div className="button cancel" onClick={() => this.setState({ currentPage: 'main' })}>返回</div>
							</div>
							{webSearching ? <div className="loading">
								<Loading />
							</div> : null}
							{webSearching ? null : <div className="lyric-list">
								<div className="lyric-line title">
									<div className="check">
										<CheckBox checked={webSearchAllSelecte} onChange={() => {
											if (!webSearchResult?.length) return
											const selected: { [i: string]: boolean } = {}
											if (!webSearchAllSelecte) webSearchResult?.forEach(item => {
												if (webSearchDownloaded.includes(item.id)) return
												selected[item.id] = true
											})
											this.setState({ webSearchSelecte: selected })
										}} />
									</div>
									<div className="name">名称</div>
									<div className="artist">歌手</div>
									<div className="websearch-remark">备注</div>
									<div className="name">专辑</div>
									<div className="duration">时长</div>
								</div>
								<div className="lyric-content">
									{(webSearchResult === null) ?
										'' :
										((webSearchResult.length == 0) ?
											'没有找到相关歌词' :
											webSearchResult.map((item) => <div className="lyric-line" key={item.id} onClick={() => {
												if (webSearchDownloaded.includes(item.id)) return
												this.setState({
													webSearchSelecte: {
														...webSearchSelecte,
														[item.id]: !webSearchSelecte[item.id],
													}
												})
											}}>
												<div className="check">
													{webSearchDownloaded.includes(item.id) ? <svg className="done" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
														<path d="M512 1024C229.216 1024 0 794.784 0 512S229.216 0 512 0s512 229.216 512 512-229.216 512-512 512z m-49.568-377.152l-146.496-148.224-96.512 92.256c70.208 37.76 168.64 106.816 252.896 213.696 59.52-111.936 243.008-340.896 332.256-361.28-14.4-57.728-22.56-166.016 0-223.872-183.04 120.704-342.144 427.424-342.144 427.424z"></path>
													</svg> : <CheckBox checked={webSearchSelecte[item.id]} />}
												</div>
												<div className="name">
													{webSearchDownloading[item.id] ? <svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
														<path d="M544.256 605.184l244.224-244.224a31.744 31.744 0 0 1 45.056 45.056l-295.424 295.424a36.864 36.864 0 0 1-51.2 0L190.464 406.528a31.744 31.744 0 1 1 45.056-45.056l244.224 244.224V111.104a32.256 32.256 0 1 1 64 0zM153.6 902.656a32.256 32.256 0 0 1 0-64h716.8a32.256 32.256 0 0 1 0 64z"></path>
													</svg> : null}
													{item.song}
												</div>
												<div className="artist">{item.singer}</div>
												<div className="websearch-remark">{item.othername || '无'}</div>
												<div className="name">{item.albumname || '无'}</div>
												<div className="duration">{util.durationStr(item.duration / 1000)}</div>
											</div>))}
								</div>
							</div>}
						</div>
					</div> :
					<div className="appbody">正在初始化...</div>
				}
			</div>
		)
	}
}