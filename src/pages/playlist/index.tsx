import './index.scss'
import { apis } from "../../api";
import { MusicIcon } from "../../components/icons/music-icon";
import { PlayingIcon } from "../../components/playing";
import { createDialog } from "../../components/popover";
import { history } from "../../libs/consts";
import { dataset } from "../../libs/dataset";
import { IMusic } from "../../libs/datatype";
import { Page } from "../../libs/page";
import { player } from "../../libs/player";
import { util } from "../../libs/util";

interface IPlaylistPageState {
	id: string
	name: string
	musics: Array<IMusic>
	menuon: string
}

export class PlaylistPage extends Page<{}, IPlaylistPageState, { id: string }> {

	constructor(props: any) {
		super(props)
		this.state = { id: this.params.id, name: '', musics: [], menuon: '' }
	}

	componentDidUpdate() {
		if (this.state.id == this.params.id) return
		this.loadMusics(this.params.id)
	}

	componentDidMount() {
		this.loadMusics(this.params.id)
	}

	private async loadMusics(id: string) {
		const info = await apis.playlist.info({ list: id })
		this.setState({ id, name: info?.name ?? '', musics: info?.musics ?? [] })
	}

	private async handleRemovMusic(music: IMusic) {
		if (!this.state.name) return
		if (!await createDialog('移除音乐', `是否将音乐《${music.name}》移出当前列表？`).wait()) return
		await apis.playlist.save({ music: music.id, list: this.state.name, action: 'del' })
		//重新加载
		this.loadMusics(this.state.id)
	}

	private async handleRemoveList() {
		if (!this.state.name) return
		if (!await createDialog('删除播放列表', `是否删除播放列表《${this.state.name}》？`).wait()) return
		await apis.playlist.remove({ list: this.state.id })
		//更新
		dataset.playlists = dataset.playlists.filter(l => l.id != this.state.id)
		//后退
		history.back()
	}

	render() {
		const { musics, menuon } = this.state
		const dinfo = dataset.playlists.filter(d => d.id == this.params.id)[0]
		return (
			<div className="playlist-page">
				{/* 标题 */}
				{dinfo ? <div className="page-title">{dinfo.name}</div> : null}
				{/* 歌曲列表 */}
				{musics.length ?
					<div className="music-list-table">
						<div className="music-list-item title-bar">
							<div className="name">歌曲名称</div>
							<div className="singer">歌手</div>
							<div className="album">专辑</div>
							<div className="time">时长</div>
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
										{/* 从歌单移除 */}
										<MusicIcon.List.RemoveFrom onClick={() => this.handleRemovMusic(music)} />
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
					<div className="list-empty">
						{dinfo ?
							<div style={{ textAlign: 'center' }}>
								<div>播放列表为空，是否考虑删除列表?</div>
								<div className="button delete-btn" onClick={this.handleRemoveList.bind(this)}>删除</div>
							</div> :
							<div>
								该播放列表已删除
							</div>}
					</div>}
			</div>
		)
	}

}