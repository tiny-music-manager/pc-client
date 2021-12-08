import './music.scss'
import { IKind, IMusic } from '../../libs/datatype'
import { apis } from '../../api'
import { CheckBox } from '../../components/checkbox'
import { Image } from '../../components/image/image'
import { util } from '../../libs/util'
import { MusicEditor } from '../editor/music/editor'
import { createDialog } from '../../components/popover'
import { LyricManager } from '../editor/lryic/manager'
import { TMMComponent } from '../../libs/component'

interface IMusicMusicManagePageState {
	musics: Array<IMusic>
	kinds: Array<IKind>
	keyword: string
	selected: string
	searching: boolean
}

export class MusicMusicManagePage extends TMMComponent<{}, IMusicMusicManagePageState> {
	private static oldState: IMusicMusicManagePageState

	constructor(props: any) {
		super(props)
		this.state = MusicMusicManagePage.oldState ?? { musics: [], kinds: [], keyword: '', selected: '', searching: false }
	}

	async componentDidMount() {
		const kinds = await apis.kind.list({})
		this.setState({ kinds })
	}

	componentWillUnmount() {
		MusicMusicManagePage.oldState = { ...this.state, searching: false }
	}

	//当前选中的歌曲
	private get current(): IMusic | null {
		const { musics, selected } = this.state
		return musics.filter(m => m.id == selected)?.[0] ?? null
	}

	//搜索
	private async handleSearch() {
		const { keyword } = this.state ?? {}
		if (!keyword) return
		this.setState({ musics: [], selected: '' })
		const musics = await apis.music.search({ keyword })
		this.setState({ musics })
	}

	//保存歌曲信息
	private async handleSaveMusic() {
		const music = this.current
		if (!music) return

		const result = await MusicEditor.open({ music })
		if (!result) return

		const { image } = await apis.music.save({
			id: music.id, name: result.name,
			artists: result.artists.map(a => a.id),
			albums: result.albums.map(a => a.id),
			types: result.types
		}, { image: result.imageFile })

		music.name = result.name
		music.artists = result.artists
		music.albums = result.albums
		music.types = result.types
		music.image = image || music.image

		this.forceUpdate()
	}

	//删除歌曲
	private async handleRemoveMusic() {
		const music = this.current
		if (!music) return

		if (!await createDialog('删除歌曲', `是否删除歌曲《${music.name} - ${music.artists.map(a => a.name).join(',')}》？`).wait()) return
		await apis.music.remove({ id: music.id })

		this.setState({ musics: this.state.musics.filter(m => m.id != music.id) })
	}

	//打开歌词管理
	private async openLyricManager() {
		const music = this.current
		if (!music) return
		await LyricManager.open({ music: music.id })
	}

	render() {
		const { musics, keyword, selected, kinds, searching } = this.state

		const kindNames = (kindIds: Array<string>) => kindIds.map(kid => kinds.filter(k => k.id == kid)[0]?.name).filter(s => !!s).join(',')

		return (
			<div className="manage-music">
				<div className="title-bar">
					<div className="search-bar">
						<form onSubmit={e => e.preventDefault() as any || (keyword.trim() && this.handleSearch())}>
							<input type="text" className="input" placeholder="输入关键字" value={keyword} onChange={e => this.setState({ keyword: e.target.value })} />
						</form>
						<div className={`button ${keyword.trim() ? '' : 'disabled'}`} onClick={() => this.handleSearch()}>搜索</div>
						<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => this.handleSaveMusic()}>编辑歌曲</div>
						<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => this.openLyricManager()}>歌词管理</div>
						<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => this.handleRemoveMusic()}>删除歌曲</div>
					</div>
				</div>
				<div className="body">
					<div className="music-line head">
						<div className="check"></div>
						<div className="image"></div>
						<div className="name">名称</div>
						<div className="artists">歌手</div>
						<div className="albums">专辑</div>
						<div className="duration">时长</div>
						<div className="types">类型</div>
					</div>
					<div className="music-container">
						{searching ? <div className="tiptxt">正在加载</div> : null}
						{searching ? null : musics.map(music => <div className="music-line" key={music.id} onClick={() => this.setState({ selected: selected == music.id ? '' : music.id })}>
							<div className="check">
								<CheckBox checked={selected == music.id} />
							</div>
							<div className="image"><Image src={music.image} type='api' string={music.name} /></div>
							<div className="name"><div className="text" title={music.name}>{music.name}</div></div>
							<div className="artists">
								<div className="text" title={music.artists.map(a => a.name).join(',')}>{music.artists.map(a => a.name).join(',') || '未知'}</div>
							</div>
							<div className="albums">
								<div className="text" title={music.albums.map(a => a.name).join(',')}>{music.albums.map(a => a.name).join(',') || '未知'}</div>
							</div>
							<div className="duration"><div className="text">{util.durationStr(music.duration)}</div></div>
							<div className="types">
								<div className="text" title={kindNames(music.types)}>{kindNames(music.types) || '无'}</div>
							</div>
						</div>)}
						{(searching || !musics.length) ? <div className="tiptxt">无搜索结果</div> : null}
					</div>
				</div>
			</div>
		)
	}
}