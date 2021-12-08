import './album.scss'
import { CheckBox } from "../../components/checkbox"
import { Image } from "../../components/image/image"
import { IAlbum } from "../../libs/datatype"
import { apis } from '../../api'
import { createDialog } from '../../components/popover'
import { AlbumEditor } from '../editor/album/editor'
import { TMMComponent } from '../../libs/component'

interface IMusicAlbumManagePageState {
	albums: Array<IAlbum>
	keyword: string
	checked: string
	searching: boolean
}

export class MusicAlbumManagePage extends TMMComponent<{}, IMusicAlbumManagePageState> {
	private static oldState: IMusicAlbumManagePageState

	constructor(props: any) {
		super(props)
		this.state = MusicAlbumManagePage.oldState ?? { albums: [], keyword: '', checked: '', searching: false }
	}

	componentWillUnmount() {
		MusicAlbumManagePage.oldState = { ...this.state, searching: false }
	}

	private async handleSearch() {
		if (this.state.searching) return
		const kw = this.state?.keyword?.trim()
		if (!kw) return
		this.setState({ albums: [], checked: '', searching: true })
		const albums = await apis.album.search({ keyword: kw })
		this.setState({ albums, searching: false })
	}

	private get current(): IAlbum | null {
		const { albums = [], checked } = this.state ?? {}
		return albums.filter(a => a.id == checked)?.[0] ?? null
	}

	private async handleSaveAlbum(type: 'add' | 'edit') {
		const album = this.current
		if (type == 'edit' && !album) return

		const result = await AlbumEditor.open({
			info: {
				id: album?.id,
				name: album?.name ?? '',
				issue: album?.issue ?? '',
				artists: [...(album?.artists ?? [])],
				desc: album?.desc ?? '',
				pic: album?.pic ?? '',
			}
		})
		if (!result) return

		//修改
		if (type == 'edit') {
			//保存
			const { pic } = await apis.album.save({
				id: album!.id, name: result.name, issue: result.issue, artists: result.artists.map(a => a.id),
				desc: result.desc,
			}, { pic: result.picFile?.path })
			//更新
			album!.name = result.name
			album!.issue = result.issue
			album!.artists = result.artists
			album!.desc = result.desc
			album!.pic = pic || album!.pic
		}

		//更新数据
		this.forceUpdate()
	}

	private async handleRemoveAlbum() {
		const album = this.current
		if (!album) return

		if (!await createDialog('删除专辑', `是否删除专辑《${album.name}》？删除后歌曲中的专辑信息也会消失，是否还要继续？`).wait()) return
		await apis.album.remove({ id: album.id })

		this.setState({ albums: this.state.albums.filter(a => a.id != album.id), checked: '' })
	}

	render() {
		const { keyword, checked, albums, searching } = this.state ?? {}
		return (
			<div className="manage-album">
				<div className="title-bar">
					<div className="search-bar">
						<form onSubmit={e => e.preventDefault() as any || (keyword.trim() && this.handleSearch())}>
							<input type="text" className="input" placeholder="输入关键字" value={keyword} onChange={e => this.setState({ keyword: e.target.value })} />
						</form>
						<div className={`button ${keyword.trim() ? '' : 'disabled'}`} onClick={() => this.handleSearch()}>搜索</div>
						<div className={`button ${checked ? '' : 'disabled'}`} onClick={() => this.handleSaveAlbum('edit')}>修改专辑</div>
						<div className={`button ${checked ? '' : 'disabled'}`} onClick={() => this.handleRemoveAlbum()}>删除专辑</div>
					</div>
				</div>
				<div className="body">
					<div className="album-line head">
						<div className="check"></div>
						<div className="pic"></div>
						<div className="name">名称</div>
						<div className="issue">发行时间</div>
						<div className="counts">歌曲数</div>
						<div className="artists">歌手</div>
						<div className="desc">介绍</div>
					</div>
					<div className="album-container">
						{searching ? <div className="tiptxt">正在加载</div> : null}
						{searching ? null : albums.map(album => <div className="album-line" key={album.id} onClick={() => this.setState({ checked: checked == album.id ? '' : album.id })}>
							<div className="check">
								<CheckBox checked={checked == album.id} />
							</div>
							<div className="pic"><Image src={album.pic} type='api' string={album.name} /></div>
							<div className="name"><div className="text">{album.name}</div></div>
							<div className="issue"><div className="text">{album.issue ?? ''}</div></div>
							<div className="counts"><div className="text">{album.counts.musics}</div></div>
							<div className="artists"><div className="text">{album.artists.map(a => a.name).join(',') || '未知'}</div></div>
							<div className="desc" title={album.desc ?? undefined}><div className="text">{album.desc}</div></div>
						</div>)}
						{(searching || !albums.length) ? <div className="tiptxt">无搜索结果</div> : null}
					</div>
				</div>
			</div>
		)
	}
}