import './detail.scss'
import { IArtist } from "../../libs/datatype"
import { Page } from "../../libs/page"
import { util } from '../../libs/util'
import { Tab } from '../../components/tab'
import { i18n } from '../../i18n'
import { MusicIcon } from '../../components/icons/music-icon'
import { MusicGroup, MusicGroupItem } from '../../components/music-group'
import { apis } from '../../api'
import { Image } from '../../components/image/image'
import { history } from '../../libs/consts'
import { player } from '../../libs/player'
import { PlayingIcon } from '../../components/playing'

interface IArtistDetailPageState {
	artist: IArtist
	tab: string
	id: string
	menuon: string
}

export class ArtistDetailPage extends Page<{}, IArtistDetailPageState, { id: string }> {

	componentDidUpdate() {
		if (this.params.id == this.state.id) return
		this.loadArtist(this.params.id)
	}

	componentDidMount() {
		this.loadArtist(this.params.id)
	}

	async loadArtist(id: string) {
		this.setState({ id })
		const [artist] = await apis.artist.list({ ids: [id] })
		this.setState({ artist })
	}

	render() {
		const { artist, tab = 'songs', menuon = '' } = this.state
		return (artist ?
			<div className="artist-detail">
				{/* 顶部标题信息 */}
				<div className="artist-title">
					<Image src={artist.avatar} type="api" string={artist.name} className="artist-avatar" />
					<div className="artist-base-info">
						<div className="name">{artist.name}</div>
						<div className="details">{artist.desc}</div>
						<div className="btns">
							<div className={`btn button ${artist.musics?.length ? '' : 'disabled'}`} onClick={() => this.handlePlay()}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M213.333333 65.386667a85.333333 85.333333 0 0 1 43.904 12.16L859.370667 438.826667a85.333333 85.333333 0 0 1 0 146.346666L257.237333 946.453333A85.333333 85.333333 0 0 1 128 873.28V150.72a85.333333 85.333333 0 0 1 85.333333-85.333333z m0 64a21.333333 21.333333 0 0 0-21.184 18.837333L192 150.72v722.56a21.333333 21.333333 0 0 0 30.101333 19.456l2.197334-1.152L826.453333 530.282667a21.333333 21.333333 0 0 0 2.048-35.178667l-2.048-1.386667L224.298667 132.416A21.333333 21.333333 0 0 0 213.333333 129.386667z"></path></svg>
								<span>{i18n.artist.detail.playAll.string}</span>
							</div>
							<div className={`btn button cancel ${artist ? '' : 'disabled'}`} onClick={() => this.handleLove('artist', artist)}>
								{this.inLove(artist.id).artist ? <MusicIcon.UnLove /> : <MusicIcon.Love />}
								<span>{this.inLove(artist.id).artist ? i18n.artist.detail.uncollect.string : i18n.artist.detail.collect.string}</span>
							</div>
						</div>
					</div>
				</div>
				{/* tab栏 */}
				<Tab items={[
					{ key: "songs", title: `${i18n.artist.detail.musics.string}(${artist.musics?.length ?? 0})` },
					{ key: "detail", title: i18n.artist.detail.detail.string },
				]} current={tab} onChange={tab => this.setState({ tab })} />
				{/* 歌曲列表 */}
				<div style={{ display: tab == 'songs' ? '' : 'none' }} className="music-list-table">
					<div className="music-list-item title-bar">
						<div className="name">{i18n.artist.detail.musicName.string}</div>
						<div className="album">{i18n.artist.detail.albumName.string}</div>
						<div className="time">{i18n.artist.detail.timeName.string}</div>
					</div>
					{artist.musics?.map((music, index, musics) => <div key={music.id} className={`music-list-item ${music.id == '2' ? 'current' : ''} ${music.id == menuon ? 'menuon' : ''}`}>
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
						<div className="album">{music.albums.map((album, n, albums) => [
							<span key={album.id} className="link black" onClick={() => history.push(`/album/${album.id}`)}>{album.name}</span>,
							(n == albums.length - 1) ? '' : ', '
						])}</div>
						<div className="time">{util.durationStr(music.duration)}</div>
					</div>)}
				</div>
				{/* 歌手信息 */}
				<div style={{ display: tab == 'detail' ? '' : 'none' }} className="artist-detail-text">
					{(artist.desc ?? '').split('\n').map(s => s.trim()).map((s, N) => <div key={N}>
						{s.split(/[:：]/g).map(s => s.trim()).map((s, N, items) => <span key={N}>{s}{(N == items.length - 1) ? null : '：'}</span>)}
					</div>)}
				</div>
				{/* 其他专辑 */}
				{!(artist.albums?.length) ? null : <MusicGroup
					title={i18n.artist.detail.otherAlbums.string}
					pageMode="scroll"
					titleHeight={50}
					pwidth={0.9}
					data={artist.albums}
					itemRender={album => <MusicGroupItem key={album.id} title={album.name} image={album.pic} onClick={() => history.push(`/album/${album.id}`)} />}
				/>}
			</div> :
			<div>Loading...</div>)
	}
}