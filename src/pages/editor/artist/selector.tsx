import './selector.scss'
import { apis } from "../../../api"
import { AppbarButtons } from "../../../components/appbar/btns"
import { IArtist } from "../../../libs/datatype"
import { Dialog } from "../../../libs/dialog"
import { CheckBox } from '../../../components/checkbox'
import { Image } from '../../../components/image/image'

interface IArtistSelectorState {
	keyword: string
	artists: Array<IArtist>
	selected: string
}

interface IArtistSelectorData {
	exclude?: Array<string>
}

interface IArtistSelectorResult extends IArtist {
}

export class ArtistSelector extends Dialog<IArtistSelectorData, IArtistSelectorResult, {}, IArtistSelectorState> {
	public static config = { name: 'artist-selector', width: 750, height: 500 }

	private async handleSearch() {
		const { keyword = '' } = this.state ?? {}
		if (!keyword.trim()) return
		this.setState({ artists: [], selected: '' })
		const artists = await apis.artist.search({ keyword }).then((res: Array<IArtist>) => res.filter(ri => !this.data.exclude?.includes(ri.id)))
		this.setState({ artists })
	}

	render() {
		const { keyword = '', artists = [], selected = '' } = this.state

		return (
			<div id="artist-selector" className="app-window">
				<div className="appbar">
					<div className="title">歌手选择</div>
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
							<div className="avatar"><div></div></div>
							<div className="name">名字</div>
							<div className="name">外文名</div>
							<div className="birthday">生日</div>
							<div className="desc">说明</div>
						</div>
						<div className="content">
							<div>
								{artists.map(artist => <div className="result-item" key={artist.id} onClick={() => this.setState({ selected: (selected == artist.id) ? '' : artist.id })}>
									<div className="check">
										<CheckBox checked={selected == artist.id} />
									</div>
									<div className="avatar">
										<Image src={artist.avatar} type='api' string={artist.name} />
									</div>
									<div className="name"><div>{artist.name}</div></div>
									<div className="name"><div>{artist.fname}</div></div>
									<div className="birthday"><div>{artist.birthday}</div></div>
									<div className="desc" title={artist.desc}><div>{artist.desc}</div></div>
								</div>)}
							</div>
						</div>
					</div>
				</div>
				<div className="appfooter">
					<div className="button cancel" onClick={() => this.exit(null)}>取消</div>
					<div className={`button ${selected ? '' : 'disabled'}`} onClick={() => {
						const current = artists.filter(a => a.id == selected)[0]
						if (!current) return
						this.exit(current)
					}}>选择</div>
				</div>
			</div>
		)
	}

}