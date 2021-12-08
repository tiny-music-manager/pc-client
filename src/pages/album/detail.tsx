import './detail.scss'
import { IAlbum } from "../../libs/datatype"
import { Page } from "../../libs/page"
import { Tab } from '../../components/tab'
import { i18n } from '../../i18n'
import { MusicIcon } from '../../components/icons/music-icon'
import { MusicGroup, MusicGroupItem } from '../../components/music-group'
import { apis } from '../../api'
import { Image } from '../../components/image/image'
import { history } from '../../libs/consts'
import { util } from '../../libs/util'
import { player } from '../../libs/player'
import { PlayingIcon } from '../../components/playing'
import { dataset } from '../../libs/dataset'

interface IAlbumDetailPageState {
	id: string
	album: IAlbum | null
	tab: string
	menuon: string
}

export class AlbumDetailPage extends Page<{}, IAlbumDetailPageState, { id: string }> {

	componentDidUpdate() {
		if (this.params.id == this.state.id) return
		this.loadAlbum(this.params.id)
	}

	async componentDidMount() {
		this.loadAlbum(this.params.id)
	}

	private async loadAlbum(id: string) {
		this.setState({ id })
		const [album] = await apis.album.list({ ids: [id] })
		this.setState({ album })
	}

	render() {
		const { album, tab = 'songs', menuon = '' } = this.state ?? {}
		return (album ?
			<div className="album-detail">
				{/* 专辑标题 */}
				<div className="album-title">
					<Image src={album.pic} type="api" string={album.name} className="album-image" />
					<div className="album-base-info">
						<div className="name">{album.name}</div>
						<div className="singer">
							{album.artists.map((artist, n, artists) => [
								<span key={artist.id} className="link black" onClick={() => history.push(`/artist/${artist.id}`)}>{artist.name}</span>,
								(n == artists.length - 1) ? '' : ', '
							])}
						</div>
						<div className="others">
							<div className="time">{album.issue ?? ''}</div>
						</div>
						<div className="btns">
							<div className={`btn button ${album.musics?.length ? '' : 'disabled'}`} onClick={() => this.handlePlay()}>
								<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M213.333333 65.386667a85.333333 85.333333 0 0 1 43.904 12.16L859.370667 438.826667a85.333333 85.333333 0 0 1 0 146.346666L257.237333 946.453333A85.333333 85.333333 0 0 1 128 873.28V150.72a85.333333 85.333333 0 0 1 85.333333-85.333333z m0 64a21.333333 21.333333 0 0 0-21.184 18.837333L192 150.72v722.56a21.333333 21.333333 0 0 0 30.101333 19.456l2.197334-1.152L826.453333 530.282667a21.333333 21.333333 0 0 0 2.048-35.178667l-2.048-1.386667L224.298667 132.416A21.333333 21.333333 0 0 0 213.333333 129.386667z"></path></svg>
								<span>{i18n.album.detail.playAll.string}</span>
							</div>
							<div className={`btn button cancel ${album ? '' : 'disabled'}`} onClick={() => this.handleLove('album', album)}>
								{dataset.love.albums.includes(album.id) ? <MusicIcon.UnLove /> : <MusicIcon.Love />}
								<span>{dataset.love.albums.includes(album.id) ? i18n.album.detail.uncollect.string : i18n.album.detail.collect.string}</span>
							</div>
						</div>
					</div>
				</div>
				{/* tab栏 */}
				<Tab items={[
					{ key: "songs", title: `${i18n.album.detail.musics.string}(${album.musics?.length ?? 0})` },
					{ key: "detail", title: i18n.album.detail.detail.string },
				]} current={tab} onChange={tab => this.setState({ tab })} />
				{/* 歌曲列表 */}
				<div style={{ display: tab == 'songs' ? '' : 'none' }} className="music-list-table">
					<div className="music-list-item title-bar">
						<div className="name">{i18n.album.detail.musicName.string}</div>
						<div className="singer">{i18n.album.detail.artistName.string}</div>
						<div className="time">{i18n.album.detail.timeName.string}</div>
					</div>
					{album.musics?.map((music, index, musics) => <div key={music.id} className={`music-list-item ${music.id == '2' ? 'current' : ''} ${music.id == menuon ? 'menuon' : ''}`}>
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
						<div className="time">{util.durationStr(music.duration)}</div>
					</div>)}
				</div>
				{/* 专辑信息 */}
				<div style={{ display: tab == 'detail' ? '' : 'none' }} className="album-detail-list">
					<div className="album-detail-item">
						<div>{i18n.album.detail.albumName.string}</div>
						<div>{album.name}</div>
					</div>
					{album.artists.length ? <div className="album-detail-item">
						<div>{i18n.album.detail.artistName.string}</div>
						<div className="keep-color">{album.artists.map((artist, index, artists) => [
							<span key={artist.id} className="link black" onClick={() => history.push(`/artist/${artist.id}`)}>{artist.name}</span>,
							(index == artists.length - 1) ? null : ', '
						])}</div>
					</div> : null}
					<div className="album-detail-item">
						<div>{i18n.album.detail.issue.string}</div>
						<div>{album.issue}</div>
					</div>
					<div className="album-detail-item">
						<div>{i18n.album.detail.descName.string}</div>
						<div>{album.desc}</div>
					</div>
				</div>
				{/* 其他专辑 */}
				{!(album.others?.length) ? null : <MusicGroup
					title={i18n.album.detail.otherAlbums.string}
					pageMode="scroll"
					titleHeight={50}
					pwidth={0.9}
					data={album.others}
					itemRender={album => <MusicGroupItem
						key={album.id}
						title={album.name}
						image={album.pic}
						onClick={() => history.push(`/album/${album.id}`)}
					/>}
				/>}
			</div> :
			<div>Loading...</div>
		)
	}

}