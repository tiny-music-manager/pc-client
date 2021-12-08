import './index.scss'
import { apis } from "../../api"
import { MusicGroup, MusicGroupItem } from "../../components/music-group"
import { i18n } from "../../i18n"
import { history } from "../../libs/consts"
import type { IAlbum, IArtist, IMusic } from "../../libs/datatype"
import { Page } from "../../libs/page"

interface IRecommendPageState {
	albums: Array<IAlbum>
	artists: Array<IArtist>
	musics: Array<IMusic>
}

export class RecommendPage extends Page<{}, IRecommendPageState> {

	async componentDidMount() {
		const { albums, artists, musics } = await apis.common.recommend({})
		this.setState({ albums, artists, musics })
	}

	render() {
		const { albums, artists, musics } = this.state ?? {}

		return (
			<div id="recommend-page">
				<div className="page-title">{i18n.recommend.title.string}</div>
				<div className="music-group-container">
					{/* 专辑推荐 */}
					{!(albums?.length) ? null : <MusicGroup
						title={i18n.recommend.albumToday.string}
						pageMode="scroll"
						titleHeight={50}
						data={albums}
						itemRender={album => <MusicGroupItem
							key={album.id}
							title={album.name}
							image={album.pic}
							onClick={() => history.push(`/album/${album.id}`)}
						/>}
					/>}
					{/* 歌手推荐 */}
					{!(artists?.length) ? null : <MusicGroup
						title={i18n.recommend.artistToday.string}
						pageMode="scroll"
						titleHeight={50}
						data={artists}
						itemRender={artist => <MusicGroupItem
							key={artist.id}
							title={artist.name}
							image={artist.avatar}
							onClick={() => history.push(`/artist/${artist.id}`)}
						/>}
					/>}
					{/* 音乐推荐 */}
					{!(musics?.length) ? null : <MusicGroup
						title={i18n.recommend.musicToday.string}
						pageMode="list"
						titleHeight={50}
						data={musics}
						itemRender={music => <MusicGroupItem
							key={music.id}
							title={music.name}
							image={music.image}
							onClick={() => this.handlePlay(musics, music.id)}
						/>}
					/>}
				</div>
			</div>
		)
	}
}