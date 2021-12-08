import './selector.scss'
import { AppbarButtons } from "../../../components/appbar/btns"
import { IAlbum } from "../../../libs/datatype"
import { Dialog } from "../../../libs/dialog"
import { CheckBox } from '../../../components/checkbox'
import { Image } from '../../../components/image/image'
import { apis } from '../../../api'

interface IAlbumSelectorState {
	selected: string
	albums: Array<IAlbum>
	keyword: string
}

interface IAlbumSelectorData {
	exclude?: Array<string>
}

interface IAlbumSelectorResult extends IAlbum { }

export class AlbumSelector extends Dialog<IAlbumSelectorData, IAlbumSelectorResult, {}, IAlbumSelectorState> {
	public static config = { name: 'album-selector', width: 740, height: 480 }

	constructor(props: any) {
		super(props)
		this.state = {
			selected: '', keyword: '',
			albums: []
		}
	}

	private get current(): IAlbum | null {
		return this.state.albums.filter(a => a.id == this.state.selected)?.[0] ?? null
	}

	private async handleSearch() {
		const { keyword } = this.state
		if (!keyword) return
		this.setState({ albums: [], selected: '' })
		const albums = await apis.album.search({ keyword })
		this.setState({ albums: albums.filter((a: IAlbum) => !this.data.exclude?.includes(a.id)) })
	}

	render() {
		const { selected, keyword, albums } = this.state

		return (
			<div className="app-window" id="album-selector">
				<div className="appbar">
					<div className="title">专辑信息</div>
					<AppbarButtons btns={['close']}
						onBtnClick={(btn) => (btn == 'close') && this.exit(null)} />
				</div>
				<div className="appbody">
					<div className="search-bar">
						<input type="text" className="input" value={keyword} placeholder="输入关键字搜索" onChange={e => this.setState({ keyword: e.target.value })} />
						<div className={`button ${keyword.trim() ? '' : 'disabled'}`} onClick={this.handleSearch.bind(this)}>搜索</div>
					</div>
					<div className="result">
						<div className="result-item title">
							<div className="check"></div>
							<div className="pic"><div></div></div>
							<div className="name">名字</div>
							<div className="artists">歌手</div>
							<div className="issue">发行时间</div>
							<div className="count">歌曲数</div>
							<div className="desc">说明</div>
						</div>
						<div className="content">
							<div>
								{albums.map(album => <div className="result-item" key={album.id} onClick={() => this.setState({ selected: (selected == album.id) ? '' : album.id })}>
									<div className="check">
										<CheckBox checked={selected == album.id} />
									</div>
									<div className="pic"><Image src={album.pic} type='api' string={album.name} /></div>
									<div className="name"><div>{album.name}</div></div>
									<div className="artists"><div>{album.artists.map(a => a.name).join(',') || '未知'}</div></div>
									<div className="issue"><div>{album.issue}</div></div>
									<div className="count"><div>{album.counts.musics}</div></div>
									<div className="desc" title={album.desc}><div>{album.desc}</div></div>
								</div>)}
							</div>
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => {
						if (!selected || !this.current) return
						this.exit(this.current)
					}}>确定</div>
				</div>
			</div>
		)
	}
}