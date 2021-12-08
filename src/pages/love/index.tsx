import './index.scss'
import { Page } from "../../libs/page"
import { Tab } from '../../components/tab'
import { i18n } from '../../i18n'
import { IAlbum, IArtist, IMusic } from '../../libs/datatype'
import { MusicIcon } from '../../components/icons/music-icon'
import { MusicGroup, MusicGroupItem } from '../../components/music-group'
import { apis } from '../../api'
import { player } from '../../libs/player'
import { history } from '../../libs/consts'
import { util } from '../../libs/util'
import { PlayingIcon } from '../../components/playing'

interface ILovePageState {
	tab: 'music' | 'album' | 'artist'
	musics: Array<IMusic>
	artists: Array<IArtist>
	albums: Array<IAlbum>
	menuon: string
}

export class LovePage extends Page<{}, ILovePageState> {
	static #oldState: ILovePageState

	private page = 1
	private limit = 100
	private finish = false
	private loading = false

	constructor(props: any) {
		super(props)
		this.state = LovePage.#oldState ?? { tab: 'music', musics: [], artists: [], albums: [], menuon: '' }
	}

	componentDidUpdate() {
		LovePage.#oldState = { ...this.state }
	}

	componentDidMount() {
		this.loadLove(1, true)
	}

	private async loadLove(page: number, reload: boolean) {
		if (!reload && this.finish) return
		if (this.loading) return
		this.loading = true

		const key = `${this.state.tab}s` as `${typeof this.state.tab}s`
		const { count, limit, ...rest } = await apis.love.list({ type: this.state.tab, page, limit: this.limit })

		this.loading = false
		this.page = page
		if (rest[key].length < limit) this.finish = true

		if (reload) this.setState(rest)
		else this.setState({ [key]: [...this.state[key], ...rest[key]] } as any)
	}

	render() {
		const { tab, musics, artists, albums, menuon } = this.state

		return (
			<div className="love-page" onScroll={e => this.handleScrollLoad(e, () => this.loadLove(this.page + 1, false))}>
				{/* 标题 */}
				<div className="page-title">我喜欢</div>
				{/* tab栏 */}
				<Tab items={[
					{ key: "music", title: `${i18n.love.tabSongs.string}` },
					{ key: "album", title: i18n.love.tabAlbums.string },
					{ key: "artist", title: i18n.love.tabArtists.string },
				]} current={tab} onChange={tab => this.setState({ tab: tab as ILovePageState['tab'] }, () => this.loadLove(1, true))} />
				{/* 歌曲列表 */}
				{tab == 'music' ? (
					musics.length ?
						<div className="music-list-table">
							<div className="music-list-item title-bar">
								<div className="name">{i18n.love.musicName.string}</div>
								<div className="singer">{i18n.love.singerName.string}</div>
								<div className="album">{i18n.love.albumName.string}</div>
								<div className="time">{i18n.love.timeName.string}</div>
							</div>
							<div className="music-list-body">
								{musics.map((music, index, musics) => <div key={music.id} className={`music-list-item ${music.id == player.music?.id ? 'current' : ''} ${music.id == menuon ? 'menuon' : ''}`}>
									<div className="name">
										{/* 00 01 02 ... ... */}
										<span className="index">{`${index + 1}`.padStart(`${musics.length}`.length, '0')}</span>
										{/* 喜欢 */}
										<span className="love link black" onClick={() => this.handleLove('music', music)}>{this.inLove(music.id).music ? <MusicIcon.UnLove /> : <MusicIcon.Love />}</span>
										{/* 名称 */}
										<span className="name">
											{player.music?.id == music.id ? <PlayingIcon /> : null}
											{music.name}
										</span>
										{/* 按钮 */}
										<span className="btns">
											{/* 播放,暂停 */}
											{(music.id == player.music?.id && player.playing)
												? <MusicIcon.List.Pause onClick={() => player.pause()} />
												: <MusicIcon.List.Play onClick={() => this.handlePlay(musics, music.id)} />}
											{/* 添加到歌单 */}
											<MusicIcon.List.AddTo onClick={e => this.handleAddTo(e, music.id, musicId => this.setState({ menuon: musicId ?? '' }))} />
											{/* 更多操作 */}
											<MusicIcon.List.More />
										</span>
									</div>
									<div className="singer">{music.artists.map((artist, index, artists) => [
										<span key={artist.id} className="link black" onClick={() => history.push(`/artist/${artist.id}`)}>{artist.name}</span>,
										(index == artists.length - 1) ? null : ', '
									])}</div>
									<div className="album">{music.albums.map((album, n, albums) => [
										<span key={album.id} className="link black" onClick={() => history.push(`/album/${album.id}`)}>{album.name}</span>,
										(n == albums.length - 1) ? '' : ', '
									])}</div>
									<div className="time">{util.durationStr(music.duration)}</div>
								</div>)}
							</div>
						</div> :
						<div>
							Musics Empty
						</div>
				) : null}
				{/* 专辑列表 */}
				{tab == 'album' ? (
					albums?.length ? <div className="music-group-container">
						<MusicGroup
							title={''}
							pageMode="list"
							data={albums}
							titleHeight={50}
							itemRender={album => <MusicGroupItem
								key={album.id}
								title={album.name}
								image={album.pic}
								onClick={() => history.push(`/album/${album.id}`)}
							/>}
						/></div> :
						<div>
							Albums Empty
						</div>
				) : null}
				{/* 歌手列表 */}
				{tab == 'artist' ? (
					artists?.length ? <div className="music-group-container">
						<MusicGroup
							title={""}
							pageMode="list"
							data={artists}
							titleHeight={50}
							itemRender={artist => <MusicGroupItem
								key={artist.id}
								title={artist.name}
								image={artist.avatar}
								onClick={() => history.push(`/artist/${artist.id}`)}
							/>}
						/></div> :
						<div>
							Artists Empty
						</div>
				) : null}
			</div>
		)
	}
}