/* eslint-disable no-eval */
import './scaner.scss'
import querystring from 'querystring'
import { Loading } from '../../../components/loading'
import { AppbarButtons } from '../../../components/appbar/btns'
import type { IUploadInfo } from '../../manage/upload'
import { apis } from '../../../api'
import { CheckBox } from '../../../components/checkbox'
import { Image } from '../../../components/image/image'
import { Dialog } from '../../../libs/dialog'
import { unescape } from 'yizhi-html-escape'

const MUSIC_TIME_RANGE = 20			//搜索音乐时时差不超过20秒
const KUWO_HEADER = {
	csrf: 'GA87T5BLM48',
	Referer: 'http://www.kuwo.cn',
	Cookie: 'kw_token=GA87T5BLM48',
	Accept: 'application/json',
	reqId: 'c224aff1-41d0-11ec-912a-fbb1a3a8fdac',
}

type TFrom = 'qq' | 'kugou' | 'kuwo' | 'local'

interface IScanMusicInfo {
	mid: string
	name: string
	singers: Array<{ id: string, name: string, avatar?: string, birthday?: string }>
	album?: { id: string, name: string }
	pic?: string
	ctime?: string
	time: string
	from: TFrom
}

interface IScanMusicArtist {
	id?: string
	mid: string
	name: string
	birthday: string
	avatar: string
	desc: string
	from: TFrom
}

interface IScanMusicAlbum {
	id?: string
	mid: string
	name: string
	issue: string
	sect?: string
	language?: string
	artists: Array<IScanMusicArtist>
	desc?: string
	pic?: string
	from: TFrom
}

interface IScanMusicResult {
	name: string
	image?: string
	albums: Array<IScanMusicAlbum>
	singers: Array<IScanMusicArtist>
}

interface IMusicScanPageState {
	musics: Array<IScanMusicInfo>
	loading: boolean
	loadingText: string
	selected: { [k: string]: boolean }
	musicName: string
	musicSinger: string
	info: IUploadInfo
	page: 'search' | 'resolve'
	result?: IScanMusicResult
	//确认信息
	// selectArtists: Array<string>				//歌手列表
	// selectAlbum: string							//专辑信息
	// selectAlbumArtists: Array<string>			//专辑歌手列表
}

interface IMergeInfo {
	albums: Array<IScanMusicAlbum>
	singers: Array<IScanMusicArtist>
	albumSingers: Array<IScanMusicArtist>		//专辑中的歌手信息
	musicImages: Array<string>
}

type ArrayType<T> = T extends Array<infer R> ? R : T

const fromDict: { [k in TFrom]: string } = {
	qq: 'QQ音乐',
	kugou: '酷狗音乐',
	kuwo: '酷我音乐',
	local: '本地',
}

//来源权值，用于排序
const fromValue: { [k in TFrom]: number } = {
	local: 1,
	qq: 2,
	kuwo: 3,
	kugou: 4,
}

interface IMusicScannerData {
	info: IUploadInfo
}

export interface IMusicScannerResult {
	name: string
	image?: string
	album?: {
		id?: string
		name: string
		issue: string
		artists: Array<{
			id?: string
			name: string
			birthday: string
			avatar: string
			desc?: string
		}>
		desc?: string
		pic?: string
	}
	singers: Array<{
		id?: string
		name: string
		birthday: string
		avatar: string
		desc?: string
	}>
}

export class MusicScanner extends Dialog<IMusicScannerData, IMusicScannerResult, {}, IMusicScanPageState> {
	public static config = { name: 'music-scanner', width: 900, height: 600 }

	//区分每一次搜索
	private searchID = 0
	private mergeInfo: IMergeInfo = { singers: [], albums: [], musicImages: [], albumSingers: [] }
	private albumSingers: Array<IScanMusicArtist> = []
	private imageSize: { [i: string]: [number, number] } = {}

	constructor(props: any) {
		super(props)
		this.state = {
			musics: [],
			loading: false,
			selected: {},
			loadingText: '',
			musicName: (this.data.info.name + '')?.trim() ?? '',
			musicSinger: (this.data.info.singer + '')?.trim() ?? '',
			info: this.data.info,
			page: 'search',
			result: undefined,
			//选择内容
			// selectArtists: [],
			// selectAlbum: '',
			// selectAlbumArtists: [],
		}
		document.title = '资源削刮器'
	}

	private get name() {
		return `${this.state.musicName}-${this.state.musicSinger}`
	}

	private mergeFunc = {
		clear: () => {
			this.mergeInfo = { singers: [], albums: [], musicImages: [], albumSingers: [] }
		},
		musicImages: {
			push: (image: string) => {
				if (this.mergeInfo.musicImages.includes(image)) return
				this.mergeInfo.musicImages.push(image)
			},
		},
		singers: {
			push: (singer: IScanMusicArtist) => {
				if (this.mergeInfo.singers.some(s => s.mid == singer.mid)) return
				this.mergeInfo.singers.push(singer)
			},
			byMid: (mid: string): (IScanMusicArtist | null) => this.mergeInfo.singers.filter(s => s.mid == mid)?.[0] ?? null,
			byName: (name: string) => this.mergeInfo.singers.filter(s => s.name == name),
			sort: () => this.mergeInfo.singers = this.singersSort(this.mergeInfo.singers),
		},
		albums: {
			push: (album: IScanMusicAlbum) => {
				if (this.mergeInfo.albums.some(a => a.mid == album.mid)) return
				this.mergeInfo.albums.push(album)
			},
			byMid: (mid: string): (IScanMusicAlbum | null) => this.mergeInfo.albums.filter(s => s.mid == mid)?.[0] ?? null,
			byName: (name: string) => this.mergeInfo.albums.filter(s => s.name == name),
			sort: () => this.mergeInfo.albums = this.albumsSort(this.mergeInfo.albums),
		},
		albumSingers: {
			push: (singer: IScanMusicArtist) => {
				if (this.mergeInfo.albumSingers.some(s => s.mid == singer.mid)) return
				this.mergeInfo.albumSingers.push(singer)
			},
			byMid: (mid: string): (IScanMusicArtist | null) => this.mergeInfo.albumSingers.filter(s => s.mid == mid)?.[0] ?? null,
			byName: (name: string) => this.mergeInfo.albumSingers.filter(s => s.name == name),
			sort: () => this.mergeInfo.albumSingers = this.singersSort(this.mergeInfo.albumSingers),
		}
	}

	//点击使用音乐信息时，对所选的音乐进行合并，同时保存合并过程中的信息到state
	private merge(data: Array<IScanMusicResult>) {
		const result: IScanMusicResult = { name: '', singers: [], albums: [] }
		this.mergeFunc.clear()
		data.forEach(d => {
			if (d.image) this.mergeFunc.musicImages.push(d.image)
			//名称
			if (!result.name) result.name = d.name
			//图片
			if (!result.image) result.image = d.image
			//歌手
			d.singers.forEach(s => {
				this.mergeFunc.singers.push(s)
				//如果没有则添加
				const [singer] = result.singers.filter(sg => sg.name == s.name)
				if (!singer) result.singers.push(s)
				else {
					if (!singer.avatar) singer.avatar = s.avatar
					if (!singer.birthday) singer.birthday = s.birthday
					if (!singer.desc) singer.desc = s.desc
				}
			})
			//专辑
			d.albums?.forEach(a => {
				this.mergeFunc.albums.push(a)
				let [album] = result.albums.filter(ab => ab.name == a.name)
				if (!album) {
					result.albums.push(a)
					album = a
				}
				else {
					if (!album.issue) album.issue = a.issue
					if (!album.sect) album.sect = a.sect
					if (!album.language) album.language = a.language
					if (!album.desc) album.desc = a.desc
					if (!album.pic) album.pic = a.pic
				}
				a.artists.forEach(at => {
					this.mergeFunc.albumSingers.push(at)
					const [artist] = album.artists.filter(a => a.name == at.name)
					if (!artist) album.artists.push(at)
					else {
						if (!artist.avatar) artist.avatar = at.avatar
						if (!artist.birthday) artist.birthday = at.birthday
						if (!artist.desc) artist.desc = at.desc
					}
				})
			})
		})
		return result
	}

	private resolveQQPic(pic: string) {
		return (pic?.[0] == '/') ? `https:${pic}` : pic
	}

	private async fetchInfo(music: IScanMusicInfo) {
		if (music.from == 'qq') {
			const body = await nativeApi.request.get(`https://y.qq.com/n/ryqq/songDetail/${music.mid}`, { type: 'text' })
			const match = body.match(/<script>[\s\S]+?window\.__INITIAL_DATA__\s*=\s*([\s\S]+?)<\/script>/)
			if (match?.[1]) {
				const res = eval(`module.export=` + match[1])
				music.ctime = res?.detail?.ctime ?? undefined
				music.pic = this.resolveQQPic(res.detail.picurl)
				this.forceUpdate()
			}
		}
		else if (music.from == 'kugou') {
			const res = await nativeApi.request.get(`http://m.kugou.com/app/i/getSongInfo.php?cmd=playInfo&hash=${music.mid}`, { type: 'json5' })
			const img: string = res.album_img || res.imgUrl
			if (img) music.pic = img.replace(/{size}\//, '')
			if (!(res.authors instanceof Array)) res.authors = null
			music.singers = (res.authors ?? []).map((a: any) => ({
				id: a.author_id,
				name: a.author_name,
				avatar: a.avatar,
				birthday: a.birthday,
			}))
			music.ctime = '无'
			this.forceUpdate()
		}
		//酷我音乐的必要信息都有了，不用再获取，只需要再最终使用是获取一次即可
		// else if (music.from == 'kuwo') { }
	}

	private async fetchQQMusicList(): Promise<Array<IScanMusicInfo>> {
		return new Promise((resolve, reject) => {
			const win = nativeApi.window.createWindow({
				width: 1300,
				height: 600,
				show: false,
				env: {
					hideAlways: true,
					loadScript: `
						setTimeout(()=>{
							let result = []
							try{
								const lis = document.querySelectorAll('ul.songlist__list>li')
								for(let i=0; i<lis.length; ++i){
									const li = lis[i]
									const nameA = li.querySelector('.songlist__songname .songlist__songname_txt a')
									const mid = nameA.href.match(/\\/([^\\/]+)$/)?.[1]
									const name = nameA.innerText
									const albumA = li.querySelector('.songlist__album a')
									const albumName = albumA?.innerText
									const albumID = albumA?.href?.match?.(/\\/([^\\/]+)$/)?.[1]
									const time = li.querySelector('.songlist__time').innerText
									const singerA = li.querySelectorAll('.songlist__artist a')
									const singers = []
									for(let j=0; j<singerA.length; ++j){
										singers.push({
											id:singerA[j].href.match(/\\/([^\\/]+)$/)?.[1],
											name:singerA[j].innerText,
										})
									}
			
									result.push({
										mid, name, 
										album:albumA?{id:albumID, name:albumName}:undefined,
										singers,
										time,
										from:'qq'
									})
								}
							}catch(err){
								result = []
							}
							nativeApi.window.closeWindow(result)
						}, 2000)
					`,
				}
			})
			win.openURL(`https://y.qq.com/n/ryqq/search?w=${encodeURIComponent(this.name)}&t=song`)
			win.onExit((data: any) => {
				resolve(data)
			})
		})
	}

	private async fetchKugouMusicList(): Promise<Array<IScanMusicInfo>> {
		const resoveStr = (str: string) => (str ?? '').replace(/<\/?\w+>/g, '')
		const qs = querystring.stringify({ keyword: this.name, page: 1, pageSize: 30 })
		const res: any = await nativeApi.request.get(`http://mobilecdn.kugou.com/api/v3/search/song?${qs}`, { type: 'json' })
		const songs: Array<any> = res?.data?.info ?? []
		const parseTime = (time: number) => `${(parseInt(time / 60 as any) + '').padStart(2, '0')}:${(time % 60 + '').padStart(2, '0')}`
		return songs.map(song => ({
			mid: song.hash,
			name: resoveStr(song.songname),
			singers: song.singername.split(/[、,]/).map((singer: string) => ({ id: null, name: resoveStr(singer) })),
			album: { id: song.album_id, name: song.album_name?.replace(/<\/?\w+>/g, '') },
			time: parseTime(song.duration),
			from: 'kugou',
		}))
	}

	//酷我音乐名称中的转义字符处理
	private resolveKuwoChar(str: string) {
		//HTML标签
		str = str
			.replace(/<\/\w+>/g, '')
			.replace(/<\w+>/g, '')
			.replace(/<\w+\s+[\s\S]+?>/g, '')
			.replace(/<br\/?>/g, '\n')
			.replace(/<\w+\/?>/g, '')
		//html转移字符
		str = unescape(str)
		//HTML标签
		str = str.replace(/<\/\w+>/g, '')
			.replace(/<\w+>/g, '')
			.replace(/<\w+\s+[\s\S]+?>/g, '')
			.replace(/<br\/?>/g, '\n')
			.replace(/<\w+\/?>/g, '')
		return str
	}

	private async fetchKuwoMusicList(): Promise<Array<IScanMusicInfo>> {
		const qs = querystring.stringify({ key: this.name, pn: 1, rn: 30 })
		const res: any = await nativeApi.request.get(`http://www.kuwo.cn/api/www/search/searchMusicBykeyWord?${qs}`, {
			type: 'json',
			headers: KUWO_HEADER,
		})
		if (res.msg != 'success') return []
		const list: Array<any> = res.data.list
		return list.map(item => {
			return {
				mid: item.rid + '',
				name: this.resolveKuwoChar(item.name),
				singers: this.resolveKuwoChar(item.artist ?? '').split(/&/g).map(s => s.trim()).filter(s => !!s).map(s => ({
					id: '',
					name: s,
				})),
				album: { id: item.albumid, name: this.resolveKuwoChar(item.album) },
				pic: item.pic || item.pic120,
				ctime: item.releaseDate,
				time: item.songTimeMinutes,
				from: 'kuwo',
			}
		})
	}

	private timeInt(time: string) {
		const [m, s] = time.split(':').map(s => parseInt(s))
		return m * 60 + s
	}

	private async fetchList() {
		if (this.state.loading) return
		const sid = ++this.searchID
		this.setState({ loading: true, loadingText: '正在加载中', musics: [] })
		let musics: Array<IScanMusicInfo> = []
		await Promise.all([
			this.fetchQQMusicList().catch(err => console.error(err)).then(res => {
				if (sid != this.searchID) return
				musics.push(...(res ?? []))
			}),
			this.fetchKugouMusicList().catch(err => console.error(err)).then(res => {
				if (sid != this.searchID) return
				musics.push(...(res ?? []))
			}),
			this.fetchKuwoMusicList().catch(err => console.error(err)).then(res => {
				if (sid != this.searchID) return
				musics.push(...(res ?? []))
			})
		])
		musics = musics
			.filter((music) => {
				//时间差距不能太多
				if (this.state.info.duration && Math.abs(this.timeInt(music.time) - this.state.info.duration) > MUSIC_TIME_RANGE) return false
				//没有歌手的不要
				if (!music.singers.length) return false
				//歌手不匹配的不要
				return music.singers.some(singer => {
					return (singer.name.indexOf(this.state.musicSinger) >= 0) || (this.state.musicSinger.indexOf(singer.name) >= 0)
				})
			})
			.sort((a, b) => {
				//按时间最接近的排序
				if (this.state.info.duration) {
					const tmcmp = Math.abs(this.timeInt(a.time) - this.state.info.duration) - Math.abs(this.timeInt(b.time) - this.state.info.duration)
					if (tmcmp) return tmcmp
				}
				//按长度排序
				return a.name.length - b.name.length
			})
		this.setState({ loading: false, musics })
		//加载信息
		const fetchInfo = async () => {
			const songs = [...this.state.musics]
			for (let i = 0; i < songs.length; i += 2) {
				await Promise.all(songs.slice(i, i + 2).map(song => this.fetchInfo(song)))
			}
		}
		fetchInfo()
	}

	private singersSort(singers: Array<IScanMusicArtist>) {
		return singers.sort((a, b) => fromValue[a.from] - fromValue[b.from])
	}

	private albumsSort(albums: Array<IScanMusicAlbum>) {
		//排序
		const result = albums.sort((a, b) => fromValue[a.from] - fromValue[b.from])
		//专辑下歌手排序
		result.forEach(album => {
			if (album.from == 'local') return			//本地的不管
			album.artists = album.artists.sort((a, b) => {
				//来源排序
				let ret = fromValue[a.from] - fromValue[b.from]
				if (ret) return ret
				//按是否在歌手列表中排序
				const msa: number = this.mergeInfo.singers.some(s => s.name == a.name) as any + 0
				const msb: number = this.mergeInfo.singers.some(s => s.name == b.name) as any + 0
				return msb - msa
			})
		})
		return result
	}

	private async getImageSize(src: string | null | undefined): Promise<[number, number]> {
		if (!src) return [0, 0]
		if (this.imageSize[src]) return [...this.imageSize[src]]
		const size = await new Promise<[number, number]>((resolve) => {
			const img = new window.Image()
			img.onload = () => resolve([img.width, img.height])
			img.onerror = () => resolve([0, 0])
			img.src = src
		})
		if (size[0] && size[1]) this.imageSize[src] = size
		return size
	}

	private async handleChoosed() {
		this.setState({ loading: true, loadingText: '正在处理结果' })
		const selected = Object.keys(this.state.selected).filter(k => this.state.selected[k])
		//选中的
		const result = await Promise.all(selected.map(async mid => {
			const [music] = this.state.musics.filter(m => m.mid == mid)
			const musicInfo: IScanMusicResult = { name: this.state.musicName, image: music.pic } as any
			//QQ音乐
			if (music.from == 'qq') {
				const resolveSinger = async (singerId: string | number): Promise<IScanMusicArtist> => {
					const body = await nativeApi.request.get(`https://y.qq.com/n/ryqq/singer/${singerId}`, { type: 'text' })
					const mt1 = body.match(/<script>([\s\S]+?)<\/script>/)
					const mt2 = mt1?.[1]?.match(/__INITIAL_DATA__\s*=([\s\S]+)/)
					if (!mt2) return null!
					const result = eval(`module.export = ${mt2?.[1]}`)
					const info = result.singerDetail
					return {
						mid: info.basic_info.singer_mid,
						name: info.basic_info.name,
						birthday: info.ex_info.birthday,
						avatar: this.resolveQQPic(info.pic.pic),
						desc: info.ex_info.desc,
						from: 'qq'
					}
				}
				//歌手信息
				if (music.singers.length) musicInfo.singers = await Promise.all(music.singers.map(s => resolveSinger(s.id))).then(ss => ss.filter(s => !!s))
				//专辑信息
				if (music.album?.id) {
					const body = await nativeApi.request.get(`https://y.qq.com/n/ryqq/albumDetail/${music.album.id}`, { type: 'text' })
					const mt1 = body.match(/<script>([\s\S]+?)<\/script>/)
					const mt2 = mt1?.[1]?.match(/__INITIAL_DATA__\s*=([\s\S]+)/)
					if (mt2) {
						const result = eval(`module.export = ${mt2?.[1]}`)
						const info = result.detail
						const artists = await Promise.all((info.singer as Array<any> ?? []).map(async singer => {
							const ready = musicInfo.singers.filter(s => s.mid == singer.mid)?.[0]
							if (ready) return ready
							return await resolveSinger(singer.mid)
						}))
						musicInfo.albums = [{
							mid: info.albumMid,
							name: info.albumName,
							issue: info.ctime,
							sect: info.genre,
							language: info.language,
							desc: info.desc,
							pic: this.resolveQQPic(info.picurl),
							artists: artists,
							from: 'qq'
						}]
					}
				}
			}
			//酷狗音乐
			else if (music.from == 'kugou') {
				//此函数用于获取歌手信息
				const getSingerInfo = (singer: ArrayType<IScanMusicInfo['singers']>): Promise<IScanMusicArtist> => nativeApi.request.get(`http://m.kugou.com/singer/info/${singer.id}&json=true`, {
					type: 'json',
					headers: { 'User-Agent': 'Mozilla/5.0 (Linux; Android 6.0; Nexus 5 Build/MRA58N) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/95.0.4638.54 Mobile Safari/537.36 Edg/95.0.1020.40' }
				}).then((res: any) => ({
					mid: res.info.singerid + '',
					name: res.info.singername,
					birthday: singer.birthday ?? '',
					avatar: res.info.imgurl.replace(/{size}\//g, ''),
					desc: res.info.profile,
					from: 'kugou',
				}))
				//加载歌曲详情
				const detail = await nativeApi.request.get(`https://wwwapi.kugou.com/yy/index.php?${querystring.stringify({ r: 'play/getdata', hash: music.mid, mid: 'c3270c9a78ca5544d517adcad960f4bf' })}`, { type: 'json' })
				const authors: Array<any> = detail.data.authors
				music.singers = authors.map(author => ({
					id: author.author_id,
					name: author.author_name,
					avatar: author.avatar,
					birthday: '',
				}))
				//获取歌手信息
				if (music.singers?.length) musicInfo.singers = await Promise.all(music.singers.map(singer => getSingerInfo(singer))) as any
				else musicInfo.singers = []
				//获取专辑信息
				if (music.album?.id) {
					const { singer, ...album } = await new Promise<any>((resolve) => {
						const win = nativeApi.window.createWindow({
							width: 800,
							height: 600,
							show: false,
							env: {
								hideAlways: true,
								loadScript: `
								const result = {}
								const detail = document.querySelector('.detail').innerText.split(/\\n/)
								detail.map(di=>di.match(/^([^:：]+)[:：]([\\s\\S]+?)$/).slice(1).map(s=>s.trim())).forEach(item=>{
									if(item[0]=='专辑名') result.name = item[1]
									else if(item[0]=='歌手') result.singer = item[1]
									else if(item[0]=='发行时间') result.issue = item[1]
								})
								result.desc = document.querySelector('.intro').innerText.trim()
								result.pic = document.querySelector('.pic img').src
								nativeApi.window.closeWindow(result)
							` }
						})
						win.openURL(`https://www.kugou.com/yy/album/single/${music.album!.id}.html`)
						win.onExit(data => {
							data.mid = music.album!.id
							resolve(data)
						})
					})
					musicInfo.albums = [{
						...album,
						artists: (singer + '').split(/[,、，]/)
							.map(s => s.trim())
							.map(name => musicInfo.singers.filter(s => s.name == name)?.[0])
							.filter(singer => !!singer),
						from: 'kugou',
					}]
				}
			}
			//酷我音乐
			else if (music.from == 'kuwo') {
				const getSingerInfo = async (id: string): Promise<IScanMusicArtist | null> => {
					const text: string = await nativeApi.request.get(`http://www.kuwo.cn/singer_detail/${id}/info`, { type: 'text' })
					const match = text.match(/<script>window.__NUXT__=([\s\S]+?)<\/script>/)
					if (!match?.[1]) return null
					const res = eval('module.exports=' + match[1])
					let info = res.data.filter((di: any) => di.singerInfo)?.[0]
					if (!info) return null
					info = info.singerInfo
					return {
						mid: info.id + '',
						name: this.resolveKuwoChar(info.name),
						birthday: info.birthday,
						avatar: info.pic || info.pic300 || info.pic120 || info.pic70 || '',
						desc: this.resolveKuwoChar(info.info ?? ''),
						from: 'kuwo',
					}
				}
				//查询音乐的歌手
				music.singers = await (async () => {
					const qs = querystring.stringify({ key: this.name, pn: 1, rn: 40 })
					const res: any = await nativeApi.request.get(`http://www.kuwo.cn/api/www/search/searchArtistBykeyWord?${qs}`, { type: 'json', headers: KUWO_HEADER })
					const list: Array<any> = res.data.list
					return list
						.map(li => ({
							id: li.id + '',
							name: this.resolveKuwoChar(li.name),
							avatar: li.pic || li.pic300 || li.pic120 || li.pic70,
							birthday: '',
						}))
						.filter(li => music.singers.some(s => s.name == li.name))
				})()
				//获取歌手详情
				musicInfo.singers = await Promise.all(music.singers.map(s => getSingerInfo(s.id))).then(res => res.filter(s => !!s).map(s => s!))
				//专辑信息
				if (music.album?.id) {
					const res: any = await nativeApi.request.get(`http://www.kuwo.cn/api/www/album/albumInfo?${querystring.stringify({ albumId: music.album.id })}`, { type: 'json', headers: KUWO_HEADER })
					const data = res.data
					if (data) {
						musicInfo.albums = [{
							mid: data.albumid + '',
							name: this.resolveKuwoChar(data.album),
							issue: data.releaseDate,
							language: data.lang,
							desc: data.albuminfo,
							pic: data.pic || '',
							artists: [],
							from: 'kuwo',
						}]
						if (data.artistid) {
							let current: IScanMusicArtist | null = musicInfo.singers.filter(s => s.mid == data.artistid)?.[0] ?? null
							if (!current) current = await getSingerInfo(data.artistid)
							if (current) musicInfo.albums[0].artists?.push(current)
						}
					}
				}
			}
			return musicInfo
		}))
		//合并信息
		const ret = this.merge(result.filter(s => !!s))
		ret.name = this.state.musicName.trim()
		this.setState({ loadingText: '正在进行内容检测' })
		//处理本地歌手
		if (ret.singers.length) {
			const artists: Array<any> = await apis.artist.list({ names: ret.singers.map(s => s.name) })
			const parsed = artists.map(artist => ({
				id: artist.id,
				mid: artist.id,
				name: artist.name,
				birthday: artist.birthday,
				avatar: artist.avatar,
				desc: artist.desc,
				from: 'local' as TFrom,
			}))
			parsed.forEach(p => this.mergeFunc.singers.push(p))
			//替换成本地
			for (let i = 0; i < ret.singers.length; ++i) {
				const [local] = parsed.filter(p => p.name == ret.singers[i].name)
				if (local) ret.singers[i] = local
			}
		}
		//获取本地专辑
		if (ret.albums.length) {
			const albums: Array<any> = await apis.album.list({ names: ret.albums.map(a => a.name.trim()).filter(n => !!n) })
			const parsed: Array<IScanMusicAlbum> = albums.map(album => ({
				id: album.id,
				mid: album.id,
				name: album.name,
				issue: album.issue,
				sect: album.sect,
				language: album.language,
				artists: (album.artists as Array<any> ?? []).map(artist => {
					//看看是否已经存在，这里的信息更详细一些
					const current = this.mergeFunc?.singers.byMid(artist.id)
					if (current) return current
					//返回信息
					return {
						id: artist.id,
						mid: artist.id,
						name: artist.name,
						birthday: '',
						avatar: artist.avatar,
						desc: '',
						from: 'local',
					}
				}),
				desc: album.desc,
				pic: album.pic,
				from: 'local',
			}))
			//保存一下专辑和歌手信息
			parsed.forEach(p => {
				console.log(p)
				this.mergeFunc.albums.push(p)
				p.artists.forEach(a => this.mergeFunc.albumSingers.push(a))
			})
			//替换成本地的
			for (let i = 0; i < ret.albums.length; ++i) {
				const [local] = parsed.filter(p => p.name == ret.albums[i].name)
				if (local) ret.albums[i] = local
			}
			//处理专辑中的本地和歌手中都没有的歌手信息
			const artists = ret.albums.reduce((prev, cur) => {
				const add = cur.artists.filter(v => !this.mergeFunc.singers.byName(v.name))
				if (!add.length) return prev
				return [...prev, ...add]
			}, [] as Array<IScanMusicArtist>)
			//看看本地是否有这些歌手，有的话替换
			if (artists.length) {
				const localArtists: Array<any> = await apis.artist.list({ names: artists.map(a => a.name) })
				const artistsParsed = localArtists.map(artist => ({
					id: artist.id,
					mid: artist.id,
					name: artist.name,
					birthday: artist.birthday,
					avatar: artist.avatar,
					desc: artist.desc,
					from: 'local' as TFrom,
				}))
				//保存一下
				artistsParsed.forEach(a => this.mergeFunc.albumSingers.push(a))
				//替换
				ret.albums.forEach(album => {
					for (let i = 0; i < album.artists.length; ++i) {
						const [current] = artistsParsed.filter(ap => ap.name == album.artists[i].name)
						if (current) album.artists[i] = current
					}
				})
			}
		}
		//进行一些排序
		ret.singers = this.singersSort(ret.singers)
		ret.albums = [this.albumsSort(ret.albums)[0]].filter(a => !!a) //使用第一个
		this.mergeFunc.singers.sort()
		this.mergeFunc.albums.sort()
		this.mergeFunc.albumSingers.sort()
		//获取最高清的图片
		this.setState({ loadingText: '正在进行图片检测' })
		let size = 0
		for (let i = 0; i < this.mergeInfo.musicImages.length; ++i) {
			const src = this.mergeInfo.musicImages[i]
			const _size = await this.getImageSize(src).then(res => res[0] * res[1])
			if (_size > size) {
				ret.image = src
				size = _size
			}
		}
		//加载歌手专辑图片信息
		for (let i = 0; i < this.mergeInfo.albumSingers.length; ++i) {
			await this.getImageSize(this.mergeInfo.albumSingers[i].avatar)
		}
		for (let i = 0; i < this.mergeInfo.singers.length; ++i) {
			await this.getImageSize(this.mergeInfo.singers[i].avatar)
		}
		for (let i = 0; i < this.mergeInfo.albums.length; ++i) {
			await this.getImageSize(this.mergeInfo.albums[i].pic)
		}
		this.setState({ loadingText: '即将完成' })
		await new Promise(resolve => setTimeout(resolve, 500))
		//完成
		this.setState({ loading: false, page: 'resolve', result: ret })
		this.initAlbumSingers()
		this.forceUpdate()
	}

	private initAlbumSingers() {
		//当前专辑
		this.albumSingers = (this.state.result?.albums[0]?.artists?.map(artist => {
			const singers = this.mergeFunc.singers.byName(artist.name)
			let singer: IScanMusicArtist
			[singer] = singers.filter(s => s.from == 'local')						//有没有本地的
			if (singer) {

			}

			if (!singer) [singer] = singers.filter(s => this.state.result?.singers.some(rs => rs.mid == s.mid))		//没有本地的，用歌手中的
			if (!singer) singer = artist											//都没有，就用自己
			return singer
		}) ?? []).filter(s => !!s)
	}

	private handleSwitchSinger(singer: IScanMusicArtist) {
		const { result } = this.state
		let found = false
		for (let i = 0; i < (result?.singers.length ?? 0); ++i) {
			const s = result?.singers[i]!
			if (s.name == singer.name) {
				if (s.mid == singer.mid) result?.singers.splice(i, 1)
				else result!.singers[i] = singer
				found = true
				break
			}
		}
		if (!found) result?.singers.push(singer)
		this.forceUpdate()
	}

	private getAlbumSingers(album: IScanMusicAlbum | null | undefined) {
		//本地专辑不管
		if (album?.from == 'local') return album.artists ?? []
		//挨个处理
		const result: Array<IScanMusicArtist> = []
		album?.artists.forEach(a => {
			//看看歌手中有没有
			const [singer] = this.state.result?.singers.filter(s => s.name == a.name) ?? []
			if (singer && !result.some(r => r.name == a.name)) return result.push(singer)
			//使用自己的
			result.push(a)
		})
		return result
	}

	//完成并退出
	private handleSaveExit() {
		const res = this.state.result!
		const result = {
			name: res.name,
			image: res.image,
			album: res.albums?.length ? {
				id: res.albums[0].id,
				name: res.albums[0].name,
				issue: res.albums[0].issue,
				sect: res.albums[0].sect,
				language: res.albums[0].language,
				artists: this.albumSingers.map(a => {
					const artist = res.singers.filter(sg => sg.name == a.name)?.[0] ?? a
					return {
						id: artist.id,
						name: artist.name,
						birthday: artist.birthday,
						avatar: artist.avatar,
						desc: artist.desc,
					}
				}),
				desc: res.albums[0].desc,
				pic: res.albums[0].pic,
			} : undefined,
			singers: res.singers.map(s => ({
				id: s.id,
				name: s.name,
				birthday: s.birthday,
				avatar: s.avatar,
				desc: s.desc,
			}))
		}
		this.exit(result)
	}

	render() {
		let { loading, loadingText, musics, selected, musicName, musicSinger, page, result } = this.state
		const { singers = [], albums: [currentAlbum = null] = [] } = result ?? {} as IScanMusicResult
		const albumSingers = this.getAlbumSingers(currentAlbum)

		const sizeTitle = (src: string | null | undefined) => this.imageSize[src ?? ''] ? `${this.imageSize[src ?? ''][0]}×${this.imageSize[src ?? ''][1]}` : undefined

		return (
			<div id="music-scan" className="app-window">
				{/* 标题栏 */}
				<div className="appbar">
					<div className="title">音乐信息</div>
					<AppbarButtons btns={['close']} onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				{/* 内容 */}
				<div className="appbody">
					{loading ? <div className="loading">
						<Loading className="rotate-icon" style={{ fontSize: '2em' }} />
						<div className="tip">{loadingText}</div>
					</div> : null}
					{(!loading && page == 'search') ? <div className="scanner">
						{/* 搜索栏 */}
						<div className="search-bar">
							<form onSubmit={e => e.preventDefault() as any || this.fetchList()}>
								<div className="label">歌曲名</div>
								<div className="input"><input className="input" value={musicName} onChange={e => this.setState({ musicName: e.target.value })} /></div>
								<div className="label">歌手</div>
								<div className="input"><input className="input" value={musicSinger} onChange={e => this.setState({ musicSinger: e.target.value })} /></div>
								<div className="button btn" onClick={() => this.fetchList()}>搜索</div>
								<button type="submit" style={{ display: 'none' }}></button>
							</form>
							<div style={{ flex: 1 }}></div>
							<div className="button btn" onClick={() => this.handleChoosed()} style={{ display: Object.keys(selected).filter(k => selected[k]).length ? '' : 'none' }}>
								使用所选音乐的信息
							</div>
						</div>
						{/* 音乐列表 */}
						<div className="musics">
							<div className="music-line title">
								<div className="check">&nbsp;</div>
								<div className="pic">&nbsp;</div>
								<div className="name">名称</div>
								<div className="singer">歌手</div>
								<div className="album">专辑</div>
								<div className="time">时长</div>
							</div>
							<div className="music-list-content">
								{musics.map(music => <div key={music.mid} className="music-line" onClick={() => {
									const _selected = { ...selected, [music.mid]: !selected[music.mid] }
									const [old] = musics.filter(m => m.mid != music.mid && selected[m.mid] && m.from == music.from)
									if (old && !selected[music.mid]) _selected[old.mid] = false
									this.setState({ selected: _selected })
								}}>
									<CheckBox checked={selected[music.mid]} />
									<div className="pic">
										{music.pic ? <Image src={music.pic} string={music.name} /> : <Loading />}
									</div>
									<div className="name" title={music.name}>
										{music.from == 'qq' ? <img src="/imgs/qqmusic.png" alt="" /> : null}
										{music.from == 'kugou' ? <img src="/imgs/kugou.jpeg" alt="" /> : null}
										{music.from == 'kuwo' ? <img src="/imgs/kuwo.png" alt="" /> : null}
										{music.name}
									</div>
									<div className="singer" title={music.singers.map(s => s.name).join(',')}>{music.singers.map(s => s.name).join(',')}</div>
									<div className="album" title={music.album?.name}>{music.album?.name}</div>
									<div className="time" title={music.time}>{music.time}</div>
								</div>)}
							</div>
						</div>
					</div> : null}
					{(!loading && page == 'resolve') ? <div className="resolver">
						<div className="groupItem">
							<div className="group-title">音乐名称</div>
							<div className="group-container">
								<input type="text" value={result?.name ?? ''} className="input" onChange={e => {
									result!.name = e.target.value
									this.forceUpdate()
								}} />
							</div>
						</div>
						<div className="groupItem">
							<div className="group-title">音乐图片</div>
							<div className="group-container">
								{this.mergeInfo.musicImages.map(img => <div
									title={sizeTitle(img)}
									onClick={e => {
										if (!result) return
										result.image = img
										this.forceUpdate()
									}}
									className={`music-img ${(result?.image == img) ? 'active' : ''}`}
									key={img}>
									<Image src={img} string={result?.name ?? musicName} />
								</div>)}
							</div>
						</div>
						<div className="groupItem">
							<div className="group-title">歌手</div>
							<div className="group-container">
								{this.mergeInfo.singers.map(singer => <div className="singer-item" key={singer.mid} id={`singer-${singer.mid}`}>
									<div
										className={`singer-container ${singers.some(s => s.mid == singer.mid) ? ' selected' : ''}`}
										onClick={() => this.handleSwitchSinger(singer)}
										title={singer.desc}
									>
										<Image className="avatar" src={singer.avatar} string={singer.name} title={sizeTitle(singer.avatar)} />
										<span>{singer.name}</span>
										<span className="from">({fromDict[singer.from]})</span>
									</div>
								</div>)}
							</div>
						</div>
						<div className="groupItem" style={{ display: currentAlbum ? '' : 'none' }}>
							<div className="group-title">专辑</div>
							<div className="group-container">
								{this.mergeInfo.albums.map(album => <div
									key={album.mid}
									className="album-item"
									onClick={() => {
										if (currentAlbum?.mid == album.mid) return
										result!.albums = [album]
										this.initAlbumSingers()
										this.forceUpdate()
									}}
								>
									<div className="base-info">
										<CheckBox checked={currentAlbum?.mid == album.mid} onChange={checked => {
											result!.albums = checked ? [album] : []
											this.initAlbumSingers()
											this.forceUpdate()
										}} />
										<Image
											title={(album.pic && this.imageSize[album.pic]) ? `${this.imageSize[album.pic][0]} x ${this.imageSize[album.pic][1]}` : undefined}
											className="album-icon"
											src={album.pic}
											string={album.name} />
										<div className="album-name" title={album.desc}>
											<span>{album.name}</span>
											<span className="from">({fromDict[album.from]})</span>
										</div>
									</div>
									<div className="artists-info" style={{ display: (currentAlbum?.mid == album.mid && currentAlbum?.artists?.length) ? '' : 'none' }}>
										{albumSingers?.map(artist => <div className="singer-item" key={artist.mid}>
											<div className={`singer-container rect-selector ${(() => {
												// if (album.from == 'local') return true		//本地音乐直接选择
												// if (result?.singers?.some(s => s.mid == artist.mid)) return true		//歌手中有的就用它了
												return this.albumSingers.some(a => a.name == artist.name)
											})() ? 'selected' : ''}`} onClick={(e) => {
												e.stopPropagation()
												if (album.from == 'local') return		//本地的不允许变动
												// if (result?.singers?.some(s => s.name == artist.name)) return		//歌手中选择的不允许再选
												//其他的正常选择
												//有则替换
												if (this.albumSingers.some(a => a.mid == artist.mid)) this.albumSingers = this.albumSingers.filter(a => a.mid != artist.mid)
												//无则添加
												else {
													this.albumSingers = this.albumSingers.filter(a => a.name != artist.name)		//不能重名
													this.albumSingers.push(artist)
												}
												//刷新
												this.forceUpdate()
											}}>
												<Image className="avatar" src={artist.avatar} string={artist.name} />
												<span>{artist.name}</span>
											</div>
										</div>)}
									</div>
								</div>)}
							</div>
						</div>
						<div className="actions">
							<div className="button" onClick={() => { this.setState({ page: 'search' }) }}>返回</div>
							<div className="button" style={{ marginLeft: 20 }} onClick={this.handleSaveExit.bind(this)}>保存信息</div>
						</div>
					</div> : null}
				</div>
			</div>
		)
	}
}
