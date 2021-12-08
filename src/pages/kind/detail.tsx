import './detail.scss'
import { IKind, IMusic } from "../../libs/datatype"
import { Page } from "../../libs/page"
import { i18n } from '../../i18n'
import { MusicIcon } from '../../components/icons/music-icon'
import { apis } from '../../api'
import { history } from '../../libs/consts'
import { util } from '../../libs/util'
import { player } from '../../libs/player'
import { PlayingIcon } from '../../components/playing'

interface IKindDetailPageProps {
	kind?: IKind
	musics?: Array<IMusic>
	menuon: string
}

export class KindDetailPage extends Page<{}, IKindDetailPageProps, { id: string }> {

	private limit = 100
	private page = 1
	private finish = false
	private loading = false

	componentDidMount() {
		this.loadDetails(1)
	}

	private async loadDetails(page: number) {
		if (this.finish || this.loading) return

		this.loading = true
		const [{ musicResult, ...kind } = {} as any] = await apis.kind.list({ id: this.params.id, musicPage: page, musicLimit: this.limit })
		this.loading = false
		if (!kind) return
		const { limit, musics } = musicResult

		this.finish = musics.length < limit
		this.page = page

		this.setState({
			kind,
			musics: [...this.state.musics ?? [], ...musics],
		})
	}

	render() {
		const { kind, musics, menuon = '' } = this.state
		return (kind ?
			<div className="kind-detail" onScroll={e => this.handleScrollLoad(e, () => this.loadDetails(this.page + 1))}>
				{/* 标题 */}
				<div className="kind-name">{kind.name}</div>
				{/* 播放按钮 */}
				<div className="btns">
					<div className="button" onClick={() => this.handlePlay()}>
						<svg viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M213.333333 65.386667a85.333333 85.333333 0 0 1 43.904 12.16L859.370667 438.826667a85.333333 85.333333 0 0 1 0 146.346666L257.237333 946.453333A85.333333 85.333333 0 0 1 128 873.28V150.72a85.333333 85.333333 0 0 1 85.333333-85.333333z m0 64a21.333333 21.333333 0 0 0-21.184 18.837333L192 150.72v722.56a21.333333 21.333333 0 0 0 30.101333 19.456l2.197334-1.152L826.453333 530.282667a21.333333 21.333333 0 0 0 2.048-35.178667l-2.048-1.386667L224.298667 132.416A21.333333 21.333333 0 0 0 213.333333 129.386667z"></path></svg>
						<span>{i18n.kind.detail.playAll.string}</span>
					</div>
				</div>
				{/* 歌曲列表 */}
				<div className="music-list-table">
					<div className="music-list-item title-bar">
						<div className="name">{i18n.kind.detail.musicName.string}</div>
						<div className="singer">{i18n.kind.detail.singerName.string}</div>
						<div className="album">{i18n.kind.detail.albumName.string}</div>
						<div className="time">{i18n.kind.detail.timeName.string}</div>
					</div>
					{musics?.map((music, index, musics) => <div key={music.id} className={`music-list-item ${music.id == '2' ? 'current' : ''} ${music.id == menuon ? 'menuon' : ''}`}>
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
						<div className="singer">{music.artists.map((artist, n, artists) => [
							<span key={artist.id} className="link black" onClick={() => history.push(`/artist/${artist.id}`)}>{artist.name}</span>,
							(n == artists.length - 1) ? '' : ', '
						])}</div>
						<div className="album">{music.albums.map((album, n, albums) => [
							<span key={album.id} className="link black" onClick={() => history.push(`/album/${album.id}`)}>{album.name}</span>,
							(n == albums.length - 1) ? '' : ', '
						])}</div>
						<div className="time">{util.durationStr(music.duration)}</div>
					</div>)}
				</div>
			</div> :
			<div>Loading...</div>
		)
	}
}
